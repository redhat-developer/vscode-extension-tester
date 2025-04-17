/* eslint-disable @typescript-eslint/no-unused-vars */
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

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { RunFileTask } from '../../tasks/RunFileTask';
import { RunAllTestsTask } from '../../tasks/RunAllTask';
import { Logger } from '../../logger/logger';
import { RunFolderTask } from '../../tasks/RunFolderTask';

/**
 * Dummy implementation of vscode.OutputChannel for testing purposes.
 * All methods are implemented as no-ops to avoid actual output during tests.
 */
const dummyOutputChannel: vscode.OutputChannel = {
	append: (value: string): void => {},
	appendLine: (value: string): void => {},
	clear: (): void => {},
	replace: (value: string): void => {},
	show: function (arg?: vscode.ViewColumn | boolean, preserveFocus?: boolean): void {
		// No-op implementation: ignore arguments.
	},
	hide: (): void => {},
	dispose: (): void => {},
	name: 'dummy',
};

/**
 * Dummy implementation of Logger for testing purposes.
 * Extends the base Logger class and overrides all logging methods as no-ops.
 */
class DummyLogger extends Logger {
	constructor() {
		// Pass the dummy output channel to the parent class constructor.
		super(dummyOutputChannel);
	}
	// Override the logging methods to no-op implementations.
	debug(message?: any, ...optionalParams: any[]): void {}
	info(message?: any, ...optionalParams: any[]): void {}
	error(message?: any, ...optionalParams: any[]): void {}
}

// Create an instance of DummyLogger to use in tests.
const dummyLogger = new DummyLogger();

/**
 * This test suite verifies the functionality of Task classes (RunFileTask, RunFolderTask, RunAllTestsTask)
 * by testing them with various random configurations. The purpose of using random configurations is to:
 * 1. Ensure the tasks work correctly across different VS Code versions and types (stable, insider)
 * 2. Validate proper handling of different root and output folder structures
 * 3. Test compatibility with various test file patterns and globs
 * 4. Verify correct processing of additional command-line arguments
 * 5. Check proper handling of different temporary storage locations
 *
 * Each test case uses a unique combination of these parameters to maximize test coverage
 * and catch potential edge cases in the task execution logic.
 */
describe('Task Command Generation', () => {
	/**
	 * Tests the RunFileTask command generation:
	 * - Verifies correct output path mapping from source to compiled files
	 * - Ensures the command uses 'npx extest setup-and-run'
	 * - Validates that the command references the compiled .js file, not the source .ts file
	 */
	it('RunFileTask generates correct output path and extest command', async () => {
		// Setup: Configure root and output folders
		const config = vscode.workspace.getConfiguration('extesterRunner');
		await config.update('rootFolder', 'src', vscode.ConfigurationTarget.Workspace);
		await config.update('outputFolder', 'out', vscode.ConfigurationTarget.Workspace);
		await config.update('visualStudioCode.Version', '1.70.0', vscode.ConfigurationTarget.Workspace);
		await config.update('visualStudioCode.Type', 'stable', vscode.ConfigurationTarget.Workspace);
		await config.update('tempFolder', '/tmp/test', vscode.ConfigurationTarget.Workspace);
		await config.update('additionalArgs', ['--flag', '--option fileValue'], vscode.ConfigurationTarget.Workspace);

		// Setup: Create a dummy test file in the workspace
		const workspacePath = vscode.workspace.workspaceFolders![0].uri.fsPath;
		const folderPath = path.join(workspacePath, 'src', 'ui-test');
		const testFile = path.join(folderPath, 'Sample.test.ts');
		fs.mkdirSync(folderPath, { recursive: true });
		fs.writeFileSync(testFile, '// dummy test file');

		// Execute: Create and inspect the RunFileTask
		const task = new RunFileTask(testFile, dummyLogger);
		const execution = task.execution as vscode.ShellExecution;

		// Assert: Verify ShellExecution properties
		assert.ok(execution, 'Task should have a ShellExecution configured');
		assert.ok(execution.command, 'ShellExecution should have a command');
		assert.ok(execution.args, 'ShellExecution should have args');

		// Assert: Verify command structure
		assert.strictEqual(execution.command, 'npx', 'Command should be npx');
		assert.ok(
			execution.args.some((arg) => typeof arg === 'string' && arg === 'extest'),
			'Args should include extest',
		);
		assert.ok(
			execution.args.some((arg) => typeof arg === 'string' && arg === 'setup-and-run'),
			'Args should include setup-and-run',
		);

		// Assert: Verify path mapping and arguments
		const expectedPath = path.join(workspacePath, 'out', 'ui-test', 'Sample.test.js');
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value.includes(expectedPath);
			}),
			`Args should include output folder path (${expectedPath})`,
		);

		// Assert: Verify additional arguments
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--flag';
			}),
			'Args should include --flag',
		);
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--option';
			}) &&
				execution.args.some((arg) => {
					const value = typeof arg === 'string' ? arg : arg.value;
					return value === 'fileValue';
				}),
			'Args should include --option fileValue',
		);

		// Assert: Verify VS Code version and type arguments
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--code_version';
			}) &&
				execution.args.some((arg) => {
					const value = typeof arg === 'string' ? arg : arg.value;
					return value === '1.70.0';
				}),
			'Args should include --code_version 1.70.0',
		);

		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--type';
			}) &&
				execution.args.some((arg) => {
					const value = typeof arg === 'string' ? arg : arg.value;
					return value === 'stable';
				}),
			'Args should include --type stable',
		);

		// Assert: Verify temp folder argument
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--storage';
			}) &&
				execution.args.some((arg) => {
					const value = typeof arg === 'string' ? arg : arg.value;
					return value.includes('/tmp/test');
				}),
			'Args should include --storage with temp folder path',
		);
	});

	/**
	 * Tests the RunAllTestsTask command generation:
	 * - Verifies correct handling of multiple test files
	 * - Ensures the command uses a glob pattern to match all test files
	 * - Validates inclusion of additional command-line arguments
	 */
	it('RunAllTestsTask aggregates multiple files and includes additional args', async () => {
		// Setup: Configure workspace settings
		const config = vscode.workspace.getConfiguration('extesterRunner');
		await config.update('rootFolder', 'test', vscode.ConfigurationTarget.Workspace);
		await config.update('outputFolder', 'dist', vscode.ConfigurationTarget.Workspace);
		await config.update('testFileGlob', '**/test/**/*.myRunAllTestFile.ts', vscode.ConfigurationTarget.Workspace);
		await config.update('visualStudioCode.Version', '1.80.0', vscode.ConfigurationTarget.Workspace);
		await config.update('visualStudioCode.Type', 'insider', vscode.ConfigurationTarget.Workspace);
		await config.update('tempFolder', '/var/tmp/testing', vscode.ConfigurationTarget.Workspace);
		await config.update('additionalArgs', ['--debug', '--env production'], vscode.ConfigurationTarget.Workspace);

		// Setup: Create multiple test files in different locations
		const workspacePath = vscode.workspace.workspaceFolders![0].uri.fsPath;
		const file1 = path.join(workspacePath, 'test', 'testA', 'First.myRunAllTestFile.ts');
		const file2 = path.join(workspacePath, 'test', 'testB', 'Second.myRunAllTestFile.ts');
		fs.mkdirSync(path.dirname(file1), { recursive: true });
		fs.mkdirSync(path.dirname(file2), { recursive: true });
		fs.writeFileSync(file1, '// dummy test file');
		fs.writeFileSync(file2, '// dummy test file');

		// Execute: Create and inspect the RunAllTestsTask
		const allFiles = [file1, file2];
		const task = new RunAllTestsTask(allFiles, dummyLogger);
		const execution = task.execution as vscode.ShellExecution;

		// Assert: Verify ShellExecution properties
		assert.ok(execution, 'Task should have a ShellExecution configured');
		assert.ok(execution.command, 'ShellExecution should have a command');
		assert.ok(execution.args, 'ShellExecution should have args');

		// Assert: Verify command structure
		assert.strictEqual(execution.command, 'npx', 'Command should be npx');
		assert.ok(
			execution.args.some((arg) => typeof arg === 'string' && arg === 'extest'),
			'Args should include extest',
		);
		assert.ok(
			execution.args.some((arg) => typeof arg === 'string' && arg === 'setup-and-run'),
			'Args should include setup-and-run',
		);

		// Assert: Verify path mapping and arguments
		const expectedPath = path.join(workspacePath, 'dist', '**', '*.myRunAllTestFile.js');
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value.includes(expectedPath);
			}),
			`Args should include output folder path (${expectedPath})`,
		);

		// Assert: Verify additional arguments
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--debug';
			}),
			'Args should include --debug',
		);
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--env';
			}) &&
				execution.args.some((arg) => {
					const value = typeof arg === 'string' ? arg : arg.value;
					return value === 'production';
				}),
			'Args should include --env production',
		);

		// Assert: Verify VS Code version and type arguments
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--code_version';
			}) &&
				execution.args.some((arg) => {
					const value = typeof arg === 'string' ? arg : arg.value;
					return value === '1.80.0';
				}),
			'Args should include --code_version 1.80.0',
		);

		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--type';
			}) &&
				execution.args.some((arg) => {
					const value = typeof arg === 'string' ? arg : arg.value;
					return value === 'insider';
				}),
			'Args should include --type insider',
		);

		// Assert: Verify temp folder argument
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--storage';
			}) &&
				execution.args.some((arg) => {
					const value = typeof arg === 'string' ? arg : arg.value;
					return value.includes('/var/tmp/testing');
				}),
			'Args should include --storage with temp folder path',
		);
	});

	/**
	 * Tests the RunFolderTask command generation:
	 * - Verifies correct handling of folder paths
	 * - Ensures the command uses array form of ShellExecution
	 * - Validates inclusion of additional command-line arguments
	 */
	it('RunFolderTask generates correct command for folder path', async () => {
		// Setup: Configure workspace settings
		const config = vscode.workspace.getConfiguration('extesterRunner');
		await config.update('rootFolder', 'test-folder-2', vscode.ConfigurationTarget.Workspace);
		await config.update('outputFolder', 'dist-folder-2', vscode.ConfigurationTarget.Workspace);
		await config.update('testFileGlob', '**/test-2/**/*.myRunFolderTestFile.ts', vscode.ConfigurationTarget.Workspace);
		await config.update('visualStudioCode.Version', '1.81.0', vscode.ConfigurationTarget.Workspace);
		await config.update('visualStudioCode.Type', 'exploration', vscode.ConfigurationTarget.Workspace);
		await config.update('tempFolder', '/var/tmp/testing-2', vscode.ConfigurationTarget.Workspace);
		await config.update('additionalArgs', ['--debug-2', '--env staging'], vscode.ConfigurationTarget.Workspace);

		// Setup: Create a test folder with a sample file
		const workspacePath = vscode.workspace.workspaceFolders![0].uri.fsPath;
		const folderPath = path.join(workspacePath, 'test-folder-2', 'ui-test');
		const testFile = path.join(folderPath, 'Sample.myRunFolderTestFile.ts');
		fs.mkdirSync(folderPath, { recursive: true });
		fs.writeFileSync(testFile, '// dummy test file');

		// Execute: Create and inspect the RunFolderTask
		const task = new RunFolderTask(folderPath, dummyLogger);
		const execution = task.execution as vscode.ShellExecution;

		// Assert: Verify ShellExecution properties
		assert.ok(execution, 'Task should have a ShellExecution configured');
		assert.ok(execution.command, 'ShellExecution should have a command');
		assert.ok(execution.args, 'ShellExecution should have args');

		// Assert: Verify command structure
		assert.strictEqual(execution.command, 'npx', 'Command should be npx');
		assert.ok(
			execution.args.some((arg) => typeof arg === 'string' && arg === 'extest'),
			'Args should include extest',
		);
		assert.ok(
			execution.args.some((arg) => typeof arg === 'string' && arg === 'setup-and-run'),
			'Args should include setup-and-run',
		);

		// Assert: Verify path mapping and arguments
		const expectedPath = path.join(workspacePath, 'dist-folder-2', 'ui-test', '*.myRunFolderTestFile.js');
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value.includes(expectedPath);
			}),
			`Args should include output folder path (${expectedPath})`,
		);

		// Assert: Verify additional arguments
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--debug-2';
			}),
			'Args should include --debug-2',
		);
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--env';
			}) &&
				execution.args.some((arg) => {
					const value = typeof arg === 'string' ? arg : arg.value;
					return value === 'staging';
				}),
			'Args should include --env staging',
		);

		// Assert: Verify VS Code version and type arguments
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--code_version';
			}) &&
				execution.args.some((arg) => {
					const value = typeof arg === 'string' ? arg : arg.value;
					return value === '1.81.0';
				}),
			'Args should include --code_version 1.81.0',
		);

		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--type';
			}) &&
				execution.args.some((arg) => {
					const value = typeof arg === 'string' ? arg : arg.value;
					return value === 'exploration';
				}),
			'Args should include --type exploration',
		);

		// Assert: Verify temp folder argument
		assert.ok(
			execution.args.some((arg) => {
				const value = typeof arg === 'string' ? arg : arg.value;
				return value === '--storage';
			}) &&
				execution.args.some((arg) => {
					const value = typeof arg === 'string' ? arg : arg.value;
					return value.includes('/var/tmp/testing-2');
				}),
			'Args should include --storage with temp folder path',
		);
	});
});
