/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { strict as assert } from 'node:assert';
import * as vscode from 'vscode';
import { writeFileSync, mkdirSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { settingsWatcher } from '../../utils/settingsWatcher';
import { LogsTreeProvider } from '../../providers/logsTreeProvider';
import { ScreenshotsTreeProvider } from '../../providers/screenshotsTreeProvider';
import { RunFileTask } from '../../tasks/RunFileTask';
import { RunFolderTask } from '../../tasks/RunFolderTask';
import { RunAllTestsTask } from '../../tasks/RunAllTask';
import { ExtesterTreeProvider } from '../../providers/extesterTreeProvider';
import { Logger } from '../../logger/logger';
import { getRunnerConfiguration } from '../../utils/projectConfiguration';

describe('Project configuration integration', () => {
	const channel = vscode.window.createOutputChannel('Project config tests');
	const logger = new Logger(channel);
	let root: string;
	let configPath: string;
	let disposables: vscode.Disposable[] = [];
	const source = 'project-config-fixture/source';
	const output = 'project-config-fixture/compiled';
	before(() => {
		root = vscode.workspace.workspaceFolders![0].uri.fsPath;
		configPath = join(root, '.extester.json');
		mkdirSync(join(root, source), { recursive: true });
		writeFileSync(join(root, source, 'sample.test.ts'), "describe('project', () => { it('works', () => {}); });");
	});
	afterEach(() => {
		disposables.forEach((item) => item.dispose());
		disposables = [];
		rmSync(configPath, { force: true });
		rmSync(join(root, 'new.other.ts'), { force: true });
		rmSync(join(root, 'healthy.test.ts'), { force: true });
	});
	after(() => rmSync(join(root, 'project-config-fixture'), { recursive: true, force: true }));
	// The extension host owns the channel; provider refreshes can still log after a test.
	function write(extra: object = {}) {
		writeFileSync(
			configPath,
			JSON.stringify({ rootFolder: source, outputFolder: output, testFileGlob: source + '/**/*.test.ts', additionalArgs: [], ...extra }),
		);
	}
	function args(task: vscode.Task): string[] {
		return ((task.execution as vscode.ShellExecution).args ?? []).map((arg) => (typeof arg === 'string' ? arg : arg.value));
	}
	it('uses the root project config for file, folder and all-test commands', () => {
		write();
		const file = join(root, source, 'sample.test.ts');
		const tasks = [new RunFileTask(file, logger), new RunFolderTask(join(root, source), logger), new RunAllTestsTask([file], logger)];
		const expected = ['sample.test.js', '*.test.js', '**/*.test.js'];
		tasks.forEach((task, index) => {
			assert.ok(
				args(task).some((arg) => arg.replaceAll("'", '').replaceAll('\\', '/') === join(root, output, expected[index]).replaceAll('\\', '/')),
				args(task).join(' '),
			);
			assert.equal((task.execution as vscode.ShellExecution).options?.cwd, root);
		});
	});
	it('passes a CLI config path with spaces as one strongly quoted argument', () => {
		write({ configFile: 'packages/test suite/extester.config.json' });
		const execution = new RunFileTask(join(root, source, 'sample.test.ts'), logger).execution as vscode.ShellExecution;
		const index = (execution.args ?? []).findIndex((arg) => arg === '--config');
		assert.notEqual(index, -1);
		assert.deepEqual(execution.args?.[index + 1], { value: join(root, 'packages/test suite/extester.config.json'), quoting: vscode.ShellQuoting.Strong });
	});
	it('rejects conflicting CLI config selections', () => {
		write({ configFile: 'extester.config.json', additionalArgs: ['--config other.json'] });
		assert.throws(() => new RunFileTask(join(root, source, 'sample.test.ts'), logger), /--config/);
	});
	it('discovers and displays tests using project values', async () => {
		write({ ignorePathPart: 'project-config-fixture/' });
		const provider = await ExtesterTreeProvider.create(logger);
		const roots = await provider.getChildren();
		assert.deepEqual(
			roots.map((item) => item.label),
			['source'],
		);
		assert.deepEqual(await provider.getAllAbsolutePaths(), [join(root, source, 'sample.test.ts')]);
	});
	it('does not execute with fallback values when the project config is invalid', () => {
		writeFileSync(configPath, '{');
		assert.throws(() => new RunFileTask(join(root, source, 'sample.test.ts'), logger), /Invalid.*\.extester\.json/);
	});
	it('does not duplicate files when refreshes overlap', async () => {
		write();
		const provider = await ExtesterTreeProvider.create(logger);
		await Promise.all([provider.refresh(), provider.refresh()]);
		assert.deepEqual(await provider.getAllAbsolutePaths(), [join(root, source, 'sample.test.ts')]);
	});
	it('retains VS Code settings for omitted values', async () => {
		const settings = vscode.workspace.getConfiguration('extesterRunner');
		const previous = settings.inspect<string>('outputFolder')?.workspaceValue;
		try {
			await settings.update('outputFolder', 'settings-output', vscode.ConfigurationTarget.Workspace);
			writeFileSync(configPath, JSON.stringify({ additionalArgs: [] }));
			assert.equal(getRunnerConfiguration().get('outputFolder'), 'settings-output');
		} finally {
			await settings.update('outputFolder', previous, vscode.ConfigurationTarget.Workspace);
		}
	});
	async function changeFolders(index: number, count: number, ...folders: { uri: vscode.Uri; name: string }[]) {
		await new Promise<void>((resolve, reject) => {
			const timer = setTimeout(() => {
				subscription.dispose();
				reject(new Error('Workspace folder change timed out'));
			}, 8000);
			const subscription = vscode.workspace.onDidChangeWorkspaceFolders(() => {
				clearTimeout(timer);
				subscription.dispose();
				resolve();
			});
			if (!vscode.workspace.updateWorkspaceFolders(index, count, ...folders)) {
				clearTimeout(timer);
				subscription.dispose();
				reject(new Error('Workspace folder update rejected'));
			}
		});
	}
	async function waitFor(check: () => Promise<boolean>) {
		const deadline = Date.now() + 8000;
		while (!(await check())) {
			assert.ok(Date.now() < deadline, 'Timed out waiting for configuration to update the view');
			await delay(25);
		}
	}
	it('updates discovery and test watchers when the project file is created, edited and deleted', async () => {
		const provider = await ExtesterTreeProvider.create(logger);
		const context = { subscriptions: disposables } as vscode.ExtensionContext;
		settingsWatcher(context, provider, new ScreenshotsTreeProvider(logger), new LogsTreeProvider(logger), logger);
		write();
		await waitFor(async () => (await provider.getAllAbsolutePaths()).includes(join(root, source, 'sample.test.ts')));
		write({ testFileGlob: '**/*.other.ts' });
		await waitFor(async () => (await provider.getAllAbsolutePaths()).length === 0);
		await vscode.workspace.fs.writeFile(vscode.Uri.file(join(root, 'new.other.ts')), Buffer.from("describe('new', () => {});"));
		await waitFor(async () => (await provider.getAllAbsolutePaths()).includes(join(root, 'new.other.ts')));
		rmSync(configPath);
		await waitFor(async () => !(await provider.getAllAbsolutePaths()).includes(join(root, 'new.other.ts')));
	});
	it('uses project temp folder and log display settings in resource views', async () => {
		write({ tempFolder: 'project-config-fixture/resources', hideEmptyLogFolders: false });
		mkdirSync(join(root, 'project-config-fixture/resources/settings/logs/empty'), { recursive: true });
		const logs = new LogsTreeProvider(logger);
		assert.equal(logs.resolveRootPath(), join(root, 'project-config-fixture/resources/settings/logs'));
		assert.deepEqual(
			(await logs.getChildren()).map((item) => item.label),
			['empty'],
		);
		const screenshots = new ScreenshotsTreeProvider(logger);
		assert.equal(screenshots.resolveRootPath(), join(root, 'project-config-fixture/resources/screenshots'));
	});
	it('selects the owning root for task configuration and test discovery', async () => {
		write();
		const other = mkdtempSync(join(tmpdir(), 'extester-second-root-'));
		const otherUri = vscode.Uri.file(other);
		try {
			mkdirSync(join(other, 'tests'), { recursive: true });
			writeFileSync(join(other, 'tests/second.test.ts'), "describe('second', () => {});");
			writeFileSync(
				join(other, '.extester.json'),
				JSON.stringify({ rootFolder: 'tests', outputFolder: 'built', testFileGlob: 'tests/*.test.ts', additionalArgs: [] }),
			);
			await changeFolders(vscode.workspace.workspaceFolders!.length, 0, { uri: otherUri, name: 'second' });
			const task = new RunFileTask(join(other, 'tests/second.test.ts'), logger);
			assert.ok(args(task).some((arg) => arg.replaceAll("'", '') === join(other, 'built/second.test.js')));
			assert.equal((task.execution as vscode.ShellExecution).options?.cwd, other);
			const provider = await ExtesterTreeProvider.create(logger);
			assert.deepEqual((await provider.getAllAbsolutePaths()).sort(), [join(root, source, 'sample.test.ts'), join(other, 'tests/second.test.ts')].sort());
			writeFileSync(join(other, '.extester.json'), '{');
			await provider.refresh();
			assert.deepEqual(await provider.getAllAbsolutePaths(), [join(root, source, 'sample.test.ts')]);
			write({ testFileGlob: '**/*.test.ts', excludeGlob: '**/{src,test-folder-2}/**' });
			settingsWatcher(
				{ subscriptions: disposables } as vscode.ExtensionContext,
				provider,
				new ScreenshotsTreeProvider(logger),
				new LogsTreeProvider(logger),
				logger,
			);
			await provider.refresh();
			writeFileSync(join(root, 'healthy.test.ts'), "describe('healthy', () => {});");
			await waitFor(async () => (await provider.getAllAbsolutePaths()).includes(join(root, 'healthy.test.ts')));
		} finally {
			const index = vscode.workspace.workspaceFolders?.findIndex((folder) => folder.uri.toString() === otherUri.toString()) ?? -1;
			if (index >= 0) {
				await changeFolders(index, 1);
			}
			rmSync(other, { recursive: true, force: true });
		}
	});
});
