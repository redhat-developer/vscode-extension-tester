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

import * as vscode from 'vscode';
import { Logger } from '../logger/logger';
import { ExtesterTreeProvider } from '../providers/extesterTreeProvider';
import { ScreenshotsTreeProvider } from '../providers/screenshotsTreeProvider';
import { LogsTreeProvider } from '../providers/logsTreeProvider';
import { createScreenshotsWatcher } from './screenshotsWatcher';
import { createLogsWatcher } from './logWatcher';
import { createFileWatcher } from './fileWatcher';
import { replaceWatchers } from './watcherStore';

/** Watch settings and root project files using the same lifecycle and configuration resolver. */
export function settingsWatcher(
	context: vscode.ExtensionContext,
	treeDataProvider: ExtesterTreeProvider,
	screenshotsDataProvider: ScreenshotsTreeProvider,
	logsDataProvider: LogsTreeProvider,
	logger: Logger,
) {
	const refresh = () => {
		try {
			createFileWatcher(context, treeDataProvider, logger);
			createLogsWatcher(context, logsDataProvider, logger);
			createScreenshotsWatcher(context, screenshotsDataProvider, logger);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.error(message);
			void vscode.window.showErrorMessage(message);
		} finally {
			void treeDataProvider.refresh();
			logsDataProvider.refresh();
			screenshotsDataProvider.refresh();
		}
	};
	const watchProjectFiles = () =>
		replaceWatchers(context, 'configuration', () =>
			(vscode.workspace.workspaceFolders ?? []).flatMap((folder) => {
				const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folder, '.extester.json'));
				return [watcher, watcher.onDidCreate(refresh), watcher.onDidChange(refresh), watcher.onDidDelete(refresh)];
			}),
		);
	watchProjectFiles();
	refresh();
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('extesterRunner')) {
				refresh();
			}
		}),
		vscode.workspace.onDidChangeWorkspaceFolders(() => {
			watchProjectFiles();
			refresh();
		}),
	);
}
