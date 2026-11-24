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
import { createLogger, Logger } from './logger/logger';
import { TestFileDiscovery } from './testing/testFileDiscovery';
import { registerCommands } from './commands/registerCommands';
import { ScreenshotsTreeProvider } from './providers/screenshotsTreeProvider';
import { LogsTreeProvider } from './providers/logsTreeProvider';
import { TestRunManager } from './tasks/runManager';
import { TestExplorer } from './testing/testExplorer';
import { screenshotOfMessage } from './testing/runReporter';

let logger: Logger;

/**
 * Activates the ExTester Runner extension.
 *
 * This function initializes the extension by setting up logging, registering the test tree view,
 * registering commands, and creating a file system watcher. It runs automatically when the extension is loaded.
 *
 * @param {vscode.ExtensionContext} context - The extension context, used for managing subscriptions.
 */
export async function activate(context: vscode.ExtensionContext) {
	// The walkthrough id is prefixed with the extension id (publisher.name), read from the manifest.
	const walkthroughId = `${context.extension.id}#extester-runner.gettingStarted`;
	context.subscriptions.push(
		vscode.commands.registerCommand('extester-runner.openWalkthrough', () =>
			vscode.commands.executeCommand('workbench.action.openWalkthrough', walkthroughId),
		),
	);

	// VS Code opens the walkthrough when the extension is installed from the Extensions view
	// (workbench.welcomePage.walkthroughs.openOnInstall), so it is not opened again on activation.
	// Opening it on activation changed the editor layout while the views were loading.

	// Create an output channel for logging.
	// The channel is disposed with the extension's subscriptions when the extension is deactivated.
	const outputChannel = vscode.window.createOutputChannel('ExTester Runner');
	context.subscriptions.push(outputChannel);
	logger = createLogger(outputChannel);

	// Discovers the test files; the Testing view lists and runs them.
	const testFileDiscovery = await TestFileDiscovery.create(logger);

	// screenshots view
	const screenshotsDataProvider = new ScreenshotsTreeProvider(logger);
	logger.debug('Registering screenshot tree view.');
	const screenshotsView = vscode.window.createTreeView('extesterResourcesScreenshotsView', {
		treeDataProvider: screenshotsDataProvider,
		showCollapseAll: true,
	});

	// logs view
	const logsDataProvider = new LogsTreeProvider(logger);
	logger.debug('Registering logs tree view.');
	const logsView = vscode.window.createTreeView('extesterResourcesLogsView', {
		treeDataProvider: logsDataProvider,
		showCollapseAll: true,
	});

	// Runs one test task at a time.
	const runManager = new TestRunManager(logger);

	// Tests in VS Code's Testing view, with a result, output and screenshot for each test.
	const testExplorer = new TestExplorer(
		testFileDiscovery,
		runManager,
		context.asAbsolutePath(path.join('out', 'resultHook.js')),
		() => screenshotsDataProvider.resolveRootPath(),
		logger,
	);

	// Dispose the views, the test discovery and the test controller with the extension.
	context.subscriptions.push(
		screenshotsView,
		logsView,
		runManager,
		testFileDiscovery,
		testExplorer,
		// "Open Screenshot" in the failure peek of the Testing view.
		vscode.commands.registerCommand('extester-runner.openTestScreenshot', (context?: { message?: vscode.TestMessage }) => {
			const screenshot = screenshotOfMessage(context?.message);
			if (screenshot) {
				void vscode.commands.executeCommand('vscode.open', screenshot);
			}
		}),
	);

	// Register extension commands.
	registerCommands(context, testFileDiscovery, screenshotsDataProvider, logsDataProvider, logger);

	logger.info('ExTester Runner extension activated successfully.');
}

/**
 * Deactivates the ExTester Runner extension.
 *
 * This function is called when VS Code shuts down or the extension is deactivated.
 * The output channel, views and test controller are disposed with the extension's subscriptions.
 */
export function deactivate() {
	// Nothing to clean up beyond the extension's subscriptions.
}
