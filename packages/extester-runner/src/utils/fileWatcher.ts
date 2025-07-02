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
import { Logger } from '../logger/logger';
import { ExtesterTreeProvider } from '../providers/extesterTreeProvider';

let watcher: vscode.FileSystemWatcher | undefined;

/**
 * Creates a file system watcher to monitor changes in the workspace.
 *
 * This function sets up a `FileSystemWatcher` that listens for file creation, deletion,
 * and modification events. When an event occurs, it logs the change and refreshes
 * the test tree view to reflect the updates.
 *
 * @param {vscode.ExtensionContext} context - The extension context, used for managing subscriptions.
 * @param {ExtesterTreeProvider} treeDataProvider - The tree data provider responsible for managing the test view.
 * @param {Logger} logger - The logging utility for debugging and tracking file system events.
 */
export function createFileWatcher(context: vscode.ExtensionContext, treeDataProvider: ExtesterTreeProvider, logger: Logger) {
	if (watcher) {
		watcher.dispose();
		logger.debug('FileWatcher: Disposed previous file watcher.');
	}

	logger.debug('FileWatcher: Creating file system watcher.');

	const configuration = vscode.workspace.getConfiguration('extesterRunner');
	const testFileGlob = configuration.get<string>('testFileGlob') ?? '**/*.test.ts';

	watcher = vscode.workspace.createFileSystemWatcher(testFileGlob);

	/**
	 * Event listener for file creation.
	 */
	watcher.onDidCreate((uri) => {
		logger.debug(`FileWatcher: Relevant file created: ${uri.fsPath}`);
		void treeDataProvider.refresh();
	});

	/**
	 * Event listener for file deletion.
	 */
	watcher.onDidChange((uri) => {
		logger.debug(`FileWatcher: Relevant file changed: ${uri.fsPath}`);
		void treeDataProvider.refresh();
	});

	/**
	 * Event listener for file modification.
	 */
	watcher.onDidDelete((uri) => {
		logger.debug(`FileWatcher: Relevant file deleted: ${uri.fsPath}`);
		void treeDataProvider.refresh();
	});

	// Register the watcher for automatic disposal when the extension is deactivated.
	context.subscriptions.push(watcher);
}
