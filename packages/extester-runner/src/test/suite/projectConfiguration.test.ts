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
import { writeFileSync, mkdirSync, rmSync, mkdtempSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { settingsWatcher } from '../../utils/settingsWatcher';
import { LogsTreeProvider } from '../../providers/logsTreeProvider';
import { ScreenshotsTreeProvider } from '../../providers/screenshotsTreeProvider';
import { RunFileTask } from '../../tasks/RunFileTask';
import { RunFolderTask } from '../../tasks/RunFolderTask';
import { RunAllTestsTask } from '../../tasks/RunAllTask';
import { folderLabel, TestFileDiscovery } from '../../testing/testFileDiscovery';
import { Logger } from '../../logger/logger';
import {
	clearProjectConfigurationCache,
	getProjectConfigurationError,
	getRunnerConfiguration,
	shouldReportConfigurationError,
} from '../../utils/projectConfiguration';

describe('Project configuration integration', () => {
	const channel = vscode.window.createOutputChannel('Project config tests');
	const logger = new Logger(channel);
	let root: string;
	let configPath: string;
	let disposables: vscode.Disposable[] = [];
	const source = 'project-config-fixture/source';
	const output = 'project-config-fixture/compiled';
	before(async () => {
		// Workspace settings override extester.config.json, so drop any left behind by other suites.
		const settings = vscode.workspace.getConfiguration('extesterRunner');
		const sections: { properties: Record<string, unknown> }[] =
			vscode.extensions.getExtension('redhat.extester-runner')!.packageJSON.contributes.configuration;
		const keys = sections.flatMap((section) => Object.keys(section.properties));
		for (const key of keys.map((name) => name.replace(/^extesterRunner\./, ''))) {
			if (settings.inspect(key)?.workspaceValue !== undefined) {
				await settings.update(key, undefined, vscode.ConfigurationTarget.Workspace);
			}
		}
		root = vscode.workspace.workspaceFolders![0].uri.fsPath;
		configPath = join(root, 'extester.config.json');
		mkdirSync(join(root, source), { recursive: true });
		writeFileSync(join(root, source, 'sample.test.ts'), "describe('project', () => { it('works', () => {}); });");
	});
	beforeEach(() => clearProjectConfigurationCache());
	afterEach(() => {
		clearProjectConfigurationCache();
		disposables.forEach((item) => item.dispose());
		disposables = [];
		rmSync(configPath, { force: true });
		rmSync(join(root, 'new.other.ts'), { force: true });
		rmSync(join(root, 'healthy.test.ts'), { force: true });
	});
	after(() => rmSync(join(root, 'project-config-fixture'), { recursive: true, force: true }));
	// The extension host owns the channel; provider refreshes can still log after a test.
	function write(runner: object = {}, sections: object = {}) {
		writeFileSync(
			configPath,
			JSON.stringify({
				runner: { rootFolder: source, outputFolder: output, testFileGlob: source + '/**/*.test.ts', additionalArgs: [], ...runner },
				...sections,
			}),
		);
	}
	async function withWorkspaceSetting(key: string, value: unknown, check: () => void | Promise<void>) {
		const settings = vscode.workspace.getConfiguration('extesterRunner');
		const previous = settings.inspect(key)?.workspaceValue;
		try {
			await settings.update(key, value, vscode.ConfigurationTarget.Workspace);
			clearProjectConfigurationCache();
			await check();
		} finally {
			await settings.update(key, previous, vscode.ConfigurationTarget.Workspace);
			clearProjectConfigurationCache();
		}
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
	it('reads a configFile in a subfolder and passes it as one strongly quoted argument', async () => {
		const nested = join(root, 'project-config-fixture', 'test suite', 'extester.config.json');
		mkdirSync(dirname(nested), { recursive: true });
		writeFileSync(nested, JSON.stringify({ runner: { rootFolder: '../source', outputFolder: '../compiled' } }));
		await withWorkspaceSetting('configFile', 'project-config-fixture/test suite/extester.config.json', () => {
			const execution = new RunFileTask(join(root, source, 'sample.test.ts'), logger).execution as vscode.ShellExecution;
			const index = (execution.args ?? []).findIndex((arg) => arg === '--config');
			assert.notEqual(index, -1);
			assert.deepEqual(execution.args?.[index + 1], { value: nested, quoting: vscode.ShellQuoting.Strong });
			assert.equal(String(execution.args?.[2]).replaceAll("'", ''), join(root, output, 'sample.test.js'));
		});
	});
	it('does not pass --config for extester.config.json in the workspace root', () => {
		write();
		const execution = new RunFileTask(join(root, source, 'sample.test.ts'), logger).execution as vscode.ShellExecution;
		assert.ok(!(execution.args ?? []).includes('--config'));
	});
	it('rejects conflicting CLI config selections', async () => {
		write({ additionalArgs: ['--config other.json'] });
		await withWorkspaceSetting('configFile', 'extester.config.json', () => {
			assert.throws(() => new RunFileTask(join(root, source, 'sample.test.ts'), logger), /--config/);
		});
	});
	it('leaves the VS Code version, type and storage folder of the configuration file to the CLI', async () => {
		write({}, { setup: { vscodeVersion: 'min', type: 'insider', storage: 'project-config-fixture/resources' } });
		const file = join(root, source, 'sample.test.ts');
		for (const option of ['--code_version', '--type', '--storage']) {
			assert.ok(!args(new RunFileTask(file, logger)).includes(option), option);
		}
		// A workspace setting is a local override of the file, so it is passed on.
		await withWorkspaceSetting('visualStudioCode.Version', '1.100.0', () => {
			const taskArgs = args(new RunFileTask(file, logger));
			assert.equal(taskArgs[taskArgs.indexOf('--code_version') + 1], '1.100.0');
		});
	});
	it('discovers and displays tests using project values', async () => {
		write({ ignorePathPart: 'project-config-fixture/' });
		clearProjectConfigurationCache();
		const provider = await TestFileDiscovery.create(logger);
		assert.equal(folderLabel(join(root, source)), 'source');
		assert.deepEqual(provider.getTestFiles(), [join(root, source, 'sample.test.ts')]);
	});
	it('does not execute with fallback values when the project config is invalid', () => {
		writeFileSync(configPath, '{');
		assert.throws(() => new RunFileTask(join(root, source, 'sample.test.ts'), logger), /Invalid.*extester\.config\.json/);
	});
	it('reports an invalid configuration once per channel until the file is read again', () => {
		writeFileSync(configPath, JSON.stringify({ runner: { typo: true } }));
		const uri = vscode.Uri.file(root);
		assert.match(getProjectConfigurationError(uri)?.message ?? '', /runner\.typo/);
		assert.equal(shouldReportConfigurationError(uri, 'test'), true);
		assert.equal(shouldReportConfigurationError(uri, 'test'), false);
		clearProjectConfigurationCache();
		assert.equal(shouldReportConfigurationError(uri, 'test'), true);
	});
	it('does not duplicate files when refreshes overlap', async () => {
		write();
		const provider = await TestFileDiscovery.create(logger);
		await Promise.all([provider.refresh(), provider.refresh()]);
		assert.deepEqual(provider.getTestFiles(), [join(root, source, 'sample.test.ts')]);
	});
	it('retains VS Code settings for omitted values and lets workspace settings override the file', async () => {
		const settings = vscode.workspace.getConfiguration('extesterRunner');
		const previous = settings.inspect<string>('outputFolder')?.workspaceValue;
		try {
			await settings.update('outputFolder', 'settings-output', vscode.ConfigurationTarget.Workspace);
			writeFileSync(configPath, JSON.stringify({ runner: { additionalArgs: [] } }));
			clearProjectConfigurationCache();
			assert.equal(getRunnerConfiguration().get('outputFolder'), 'settings-output');
			// A workspace setting is a local override and wins over the shared project file.
			writeFileSync(configPath, JSON.stringify({ runner: { outputFolder: 'project-output' } }));
			clearProjectConfigurationCache();
			assert.equal(getRunnerConfiguration().get('outputFolder'), 'settings-output');
			await settings.update('outputFolder', undefined, vscode.ConfigurationTarget.Workspace);
			assert.equal(getRunnerConfiguration().get('outputFolder'), 'project-output');
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
		const provider = await TestFileDiscovery.create(logger);
		const context = { subscriptions: disposables } as vscode.ExtensionContext;
		settingsWatcher(context, provider, new ScreenshotsTreeProvider(logger), new LogsTreeProvider(logger), logger);
		write();
		await waitFor(async () => provider.getTestFiles().includes(join(root, source, 'sample.test.ts')));
		write({ testFileGlob: '**/*.other.ts' });
		await waitFor(async () => provider.getTestFiles().length === 0);
		await vscode.workspace.fs.writeFile(vscode.Uri.file(join(root, 'new.other.ts')), Buffer.from("describe('new', () => {});"));
		await waitFor(async () => provider.getTestFiles().includes(join(root, 'new.other.ts')));
		rmSync(configPath);
		await waitFor(async () => !provider.getTestFiles().includes(join(root, 'new.other.ts')));
	});
	it('uses the storage folder of the configuration file in resource views', () => {
		write({}, { setup: { storage: 'project-config-fixture/resources' } });
		clearProjectConfigurationCache();
		const real = realpathSync(root);
		const logs = new LogsTreeProvider(logger);
		assert.equal(logs.resolveRootPath(), join(real, 'project-config-fixture/resources/settings/logs'));
		const screenshots = new ScreenshotsTreeProvider(logger);
		assert.equal(screenshots.resolveRootPath(), join(real, 'project-config-fixture/resources/screenshots'));
	});
	it('keeps the resource views working when the project config is invalid', () => {
		writeFileSync(configPath, '{');
		clearProjectConfigurationCache();
		assert.doesNotThrow(() => new LogsTreeProvider(logger).resolveRootPath());
		assert.doesNotThrow(() => new ScreenshotsTreeProvider(logger).resolveRootPath());
	});
	it('selects the owning root for task configuration and test discovery', async () => {
		write();
		// Normalise through a URI: VS Code writes a lowercase drive letter on Windows, os.tmpdir() an uppercase one.
		const other = vscode.Uri.file(mkdtempSync(join(tmpdir(), 'extester-second-root-'))).fsPath;
		const otherUri = vscode.Uri.file(other);
		try {
			mkdirSync(join(other, 'tests'), { recursive: true });
			writeFileSync(join(other, 'tests/second.test.ts'), "describe('second', () => {});");
			writeFileSync(
				join(other, 'extester.config.json'),
				JSON.stringify({ runner: { rootFolder: 'tests', outputFolder: 'built', testFileGlob: 'tests/*.test.ts', additionalArgs: [] } }),
			);
			await changeFolders(vscode.workspace.workspaceFolders!.length, 0, { uri: otherUri, name: 'second' });
			const task = new RunFileTask(join(other, 'tests/second.test.ts'), logger);
			assert.ok(args(task).some((arg) => arg.replaceAll("'", '') === join(other, 'built/second.test.js')));
			assert.equal((task.execution as vscode.ShellExecution).options?.cwd, other);
			const provider = await TestFileDiscovery.create(logger);
			assert.deepEqual(provider.getTestFiles().sort(), [join(root, source, 'sample.test.ts'), join(other, 'tests/second.test.ts')].sort());
			writeFileSync(join(other, 'extester.config.json'), '{');
			clearProjectConfigurationCache();
			await provider.refresh();
			assert.deepEqual(provider.getTestFiles(), [join(root, source, 'sample.test.ts')]);
			write({ testFileGlob: '**/*.test.ts', excludeGlob: '**/{src,test-folder-2}/**' });
			clearProjectConfigurationCache();
			settingsWatcher(
				{ subscriptions: disposables } as vscode.ExtensionContext,
				provider,
				new ScreenshotsTreeProvider(logger),
				new LogsTreeProvider(logger),
				logger,
			);
			await provider.refresh();
			writeFileSync(join(root, 'healthy.test.ts'), "describe('healthy', () => {});");
			await waitFor(async () => provider.getTestFiles().includes(join(root, 'healthy.test.ts')));
		} finally {
			try {
				const index = vscode.workspace.workspaceFolders?.findIndex((folder) => folder.uri.toString() === otherUri.toString()) ?? -1;
				if (index >= 0) {
					await changeFolders(index, 1);
				}
			} finally {
				// Windows refuses to delete a directory that is still watched, so stop the watchers first.
				disposables.forEach((item) => item.dispose());
				disposables = [];
				rmSync(other, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
			}
		}
	});
});
