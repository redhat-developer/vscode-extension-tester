/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as vscode from 'vscode';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { rm } from 'node:fs/promises';
import { Logger } from '../logger/logger';
import { TestFileDiscovery, folderLabel } from './testFileDiscovery';
import { clearProjectConfigurationCache } from '../utils/projectConfiguration';
import { listRunTargets } from '../utils/runTargets';
import { TestRunManager } from '../tasks/runManager';
import { RunResult, TestRunner } from '../tasks/TestRunnerTask';
import { RunAllTestsTask } from '../tasks/RunAllTask';
import { RunFileTask } from '../tasks/RunFileTask';
import { RunFolderTask } from '../tasks/RunFolderTask';
import { RunTestTask } from '../tasks/RunTestTask';
import { TestRunTarget } from '../types/testTypes';
import { parseTestFile } from '../utils/parser';
import { ResultReader } from './resultReader';
import { Leaf, RunReporter } from './runReporter';

/** What a test item stands for. */
type ItemData = { kind: 'folder'; path: string } | { kind: 'file'; path: string } | { kind: 'block'; target: TestRunTarget };

/** One test task of a run, and the test items it covers. */
interface Job {
	label: string;
	items: vscode.TestItem[];
	createTask: () => TestRunner;
}

/**
 * Joins titles in test item ids. VS Code uses the NUL character to separate the ids of nested test
 * items internally, so it must not appear in an id.
 */
const TITLE_SEPARATOR = ' \u203A ';

/** Tags of tests marked with `.only` or `.skip`, for the filter of the Testing view. */
const MODIFIER_TAGS: Record<string, vscode.TestTag> = { only: new vscode.TestTag('only'), skip: new vscode.TestTag('skip') };

/** Waits this long after the last change of the test files before the Testing view is rebuilt. */
const REFRESH_DELAY = 300;

/**
 * Shows the discovered UI tests in VS Code's Testing view and runs them from there.
 *
 * Tests run in VS Code tasks, one task at a time through the run manager, with `preRunTask` and `env`.
 * The result of each test comes from a small hook preloaded into the `extest` process (see `resultHook.ts`).
 */
export class TestExplorer implements vscode.Disposable {
	private readonly controller: vscode.TestController;
	private readonly data = new WeakMap<vscode.TestItem, ItemData>();
	private readonly disposables: vscode.Disposable[] = [];
	private refreshTimer: NodeJS.Timeout | undefined;
	private refreshGeneration = 0;

	/**
	 * Creates the test controller and fills it with the discovered tests.
	 *
	 * @param {TestFileDiscovery} provider - Discovers the test files.
	 * @param {TestRunManager} runManager - Runs one test task at a time.
	 * @param {string} hookPath - Absolute path of the bundled result hook.
	 * @param {() => string | undefined} getScreenshotsRoot - The folder ExTester writes screenshot folders to.
	 * @param {Logger} logger - The logger instance for logging messages.
	 */
	constructor(
		private readonly provider: TestFileDiscovery,
		private readonly runManager: TestRunManager,
		private readonly hookPath: string,
		private readonly getScreenshotsRoot: () => string | undefined,
		private readonly logger: Logger,
	) {
		this.controller = vscode.tests.createTestController('extesterRunner', 'ExTester');
		// Refresh Tests also reads the configuration files again, e.g. after a change in a base file they extend.
		this.controller.refreshHandler = () => {
			clearProjectConfigurationCache();
			return this.provider.refresh();
		};
		this.controller.createRunProfile('Run', vscode.TestRunProfileKind.Run, (request, token) => this.runHandler(request, token), true);
		this.disposables.push(
			this.controller,
			provider.onDidChange(() => this.scheduleRefresh()),
		);
		this.scheduleRefresh();
	}

	dispose(): void {
		clearTimeout(this.refreshTimer);
		this.disposables.forEach((disposable) => disposable.dispose());
	}

	private scheduleRefresh(): void {
		clearTimeout(this.refreshTimer);
		this.refreshTimer = setTimeout(() => {
			this.refresh().catch((error) => this.logger.error(`Testing view: cannot list the tests: ${error instanceof Error ? error.stack : String(error)}`));
		}, REFRESH_DELAY);
	}

	/**
	 * Rebuilds the test items: folders, files, `describe` blocks and `it` tests.
	 */
	private async refresh(): Promise<void> {
		const generation = ++this.refreshGeneration;
		const files = this.provider.getTestFiles();
		const parsed = await Promise.all(
			files.map(async (file) => {
				try {
					return { file, targets: listRunTargets(await parseTestFile(vscode.Uri.file(file), this.logger)) };
				} catch (error) {
					return { file, targets: [] as TestRunTarget[], error: error instanceof Error ? error.message : String(error) };
				}
			}),
		);
		if (generation !== this.refreshGeneration) {
			return;
		}

		const folders = new Map<string, vscode.TestItem>();
		for (const { file, targets, error } of parsed) {
			const folderPath = path.dirname(file);
			let folder = folders.get(folderPath);
			if (!folder) {
				folder = this.createItem('folder:' + folderPath, folderLabel(folderPath), { kind: 'folder', path: folderPath }, vscode.Uri.file(folderPath));
				folders.set(folderPath, folder);
			}
			const uri = vscode.Uri.file(file);
			const fileItem = this.createItem('file:' + file, path.basename(file), { kind: 'file', path: file }, uri);
			if (error) {
				fileItem.error = `Cannot parse this file: ${error}`;
			}
			this.addBlocks(fileItem, uri, targets);
			if (targets.some((target) => target.modifier === 'only')) {
				// `.only` makes Mocha skip every other test of the run: say so on the file.
				fileItem.description = '.only';
			}
			folder.children.add(fileItem);
		}
		this.controller.items.replace([...folders.values()].sort((a, b) => a.label.localeCompare(b.label)));
		this.logger.debug(`Testing view: ${files.length} test files in ${folders.size} folders.`);
	}

	/**
	 * Adds the `describe` blocks and `it` tests of a file to its item, nested as in the file.
	 */
	private addBlocks(fileItem: vscode.TestItem, uri: vscode.Uri, targets: TestRunTarget[]): void {
		const byTitles = new Map<string, vscode.TestItem>();
		for (const target of targets) {
			const key = target.titles.join(TITLE_SEPARATOR);
			const id = `${target.file}::${target.isTest ? 'it' : 'describe'}::${key}`;
			const item = this.createItem(id, target.titles.at(-1) ?? '', { kind: 'block', target }, uri);
			item.range = new vscode.Range(target.line - 1, 0, target.line - 1, 0);
			// Own `.only` / `.skip` next to the name; own or inherited ones as tags, so `@extesterRunner:only` filters them.
			item.description = target.modifier;
			const modifier = target.modifier ?? target.inheritedModifier;
			item.tags = modifier && MODIFIER_TAGS[modifier] ? [MODIFIER_TAGS[modifier]] : [];
			const parent = byTitles.get(target.titles.slice(0, -1).join(TITLE_SEPARATOR)) ?? fileItem;
			parent.children.add(item);
			if (!target.isTest) {
				byTitles.set(key, item);
			}
		}
	}

	private createItem(id: string, label: string, data: ItemData, uri: vscode.Uri): vscode.TestItem {
		const item = this.controller.createTestItem(id, label, uri);
		this.data.set(item, data);
		return item;
	}

	/**
	 * Runs the requested tests: one test task per requested item, or one per workspace folder for all tests.
	 */
	private async runHandler(request: vscode.TestRunRequest, token: vscode.CancellationToken): Promise<void> {
		if (request.exclude?.length) {
			this.logger.info('Testing view: excluded tests are not supported yet and run with the others.');
		}
		const cancel = token.onCancellationRequested(() => this.runManager.stop());
		try {
			await this.runManager.startGroup(async () => {
				const run = this.controller.createTestRun(request);
				// Show the run's output in Test Results instead of the task terminal.
				void vscode.commands.executeCommand('testing.showMostRecentOutput').then(undefined, () => undefined);
				try {
					await this.createJobs(request).reduce((previous, job) => previous.then(() => this.runJob(run, job)), Promise.resolve());
				} finally {
					run.end();
				}
			});
		} finally {
			cancel.dispose();
		}
	}

	private createJobs(request: vscode.TestRunRequest): Job[] {
		if (request.include) {
			return request.include.map((item) => ({ label: item.label, items: [item], createTask: () => this.createTask(item) }));
		}
		// All tests: one task per workspace folder, as the Run All command does.
		const roots: vscode.TestItem[] = [];
		this.controller.items.forEach((item) => roots.push(item));
		return (vscode.workspace.workspaceFolders ?? [])
			.map((folder) => {
				const inFolder = roots.filter((item) => item.uri && vscode.workspace.getWorkspaceFolder(item.uri)?.uri.toString() === folder.uri.toString());
				const files: string[] = [];
				inFolder.forEach((item) => item.children.forEach((file) => files.push((this.data.get(file) as { path: string }).path)));
				return { label: `tests in ${folder.name}`, items: inFolder, createTask: () => new RunAllTestsTask(files, this.logger) };
			})
			.filter((job) => job.items.length > 0);
	}

	private createTask(item: vscode.TestItem): TestRunner {
		const data = this.data.get(item);
		switch (data?.kind) {
			case 'folder':
				return new RunFolderTask(data.path, this.logger);
			case 'file':
				return new RunFileTask(data.path, this.logger);
			case 'block':
				return new RunTestTask(data.target.file, data.target.titles, data.target.isTest, this.logger);
			default:
				throw new Error(`Unknown test item ${item.id}`);
		}
	}

	/**
	 * Runs one test task and reports the result of each of its tests.
	 */
	private async runJob(run: vscode.TestRun, job: Job): Promise<void> {
		const leaves = job.items.flatMap((item) => this.collectLeaves(item));
		leaves.forEach((leaf) => run.enqueued(leaf.item));
		if (this.runManager.wasStopped) {
			leaves.forEach((leaf) => run.skipped(leaf.item));
			return;
		}

		let task: TestRunner;
		try {
			task = job.createTask();
		} catch (error) {
			const message = new vscode.TestMessage(`Cannot run ${job.label}: ${error instanceof Error ? error.message : String(error)}`);
			leaves.forEach((leaf) => run.errored(leaf.item, message));
			return;
		}

		const resultsFile = path.join(tmpdir(), `extester-runner-${randomUUID()}.jsonl`);
		// The hook removes this option again in the process that loads Mocha, so that VS Code does not inherit it.
		const hookOption = `--require "${this.hookPath}"`;
		const nodeOptions = [process.env.NODE_OPTIONS, hookOption].filter(Boolean).join(' ');
		task.addEnvironment({ EXTESTER_RUNNER_RESULTS: resultsFile, EXTESTER_RUNNER_HOOK_OPTION: hookOption, NODE_OPTIONS: nodeOptions });
		const reporter = new RunReporter(run, leaves, this.getScreenshotsRoot(), Date.now(), this.logger);
		const reader = new ResultReader(resultsFile, (event) => reporter.report(event));
		try {
			const result = await this.runManager.run(task);
			await reader.close();
			reporter.flushFailures();
			const message = this.notStartedMessage(result, reporter.hasResults);
			for (const leaf of leaves.filter((candidate) => !candidate.done)) {
				if (message) {
					run.errored(leaf.item, message);
				} else {
					// Not run: filtered out by .only or grep, stopped, or reported under a title the parser could not match.
					run.skipped(leaf.item);
				}
			}
		} finally {
			await reader.close();
			await rm(resultsFile, { force: true });
		}
	}

	/**
	 * Explains why no test ran, when the run failed before Mocha reported any test.
	 */
	private notStartedMessage(result: RunResult, reported: boolean): vscode.TestMessage | undefined {
		if (result.failedStep) {
			return new vscode.TestMessage(`The tests did not start: ${result.failedStep}.`);
		}
		if (!reported && result.outcome === 'failed') {
			return new vscode.TestMessage(`The test command failed (exit code ${result.exitCode}) before any test ran. See the task terminal for its output.`);
		}
		return undefined;
	}

	private collectLeaves(item: vscode.TestItem): Leaf[] {
		const data = this.data.get(item);
		if (data?.kind === 'block' && data.target.isTest) {
			return [{ item, titles: data.target.titles, done: false }];
		}
		const leaves: Leaf[] = [];
		item.children.forEach((child) => leaves.push(...this.collectLeaves(child)));
		return leaves;
	}
}
