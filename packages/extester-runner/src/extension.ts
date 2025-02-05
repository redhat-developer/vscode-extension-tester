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
import { createLogger, Logger } from './logger/logger';
import { ExtesterTreeProvider } from './providers/extesterTreeProvider';
import { registerCommands } from './commands/registerCommands';
import { createFileWatcher } from './utils/fileWatcher';

let logger: Logger;

/**
 * Activates the ExTester Runner extension.
 *
 * This function initializes the extension by setting up logging, registering the test tree view,
 * registering commands, and creating a file system watcher. It runs automatically when the extension is loaded.
 *
 * @param {vscode.ExtensionContext} context - The extension context, used for managing subscriptions.
 */
export function activate(context: vscode.ExtensionContext) {
	// Create an output channel for logging.
	const outputChannel = vscode.window.createOutputChannel('ExTester Runner');
	logger = createLogger(outputChannel);

	logger.info('Activating ExTester Runner extension...');

	// Register the test tree view.
	const treeDataProvider = new ExtesterTreeProvider(logger);
	logger.debug('Registering tree view.');
	vscode.window.createTreeView('extesterView', {
		treeDataProvider: treeDataProvider,
		showCollapseAll: true,
	});

	// Register extension commands.
	registerCommands(context, treeDataProvider, logger);

	// Create a file system watcher to monitor changes.
	createFileWatcher(context, treeDataProvider, logger);

	logger.info('ExTester Runner extension activated successfully.');
}

/**
 * Deactivates the ExTester Runner extension.
 *
 * This function is called when VS Code shuts down or the extension is deactivated.
 * It disposes of the output channel to free resources.
 */
export function deactivate() {
	vscode.window.createOutputChannel('ExTester Runner').dispose();
}
