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
import { TestFileDiscovery } from '../testing/testFileDiscovery';
import { ScreenshotsTreeProvider } from '../providers/screenshotsTreeProvider';
import { LogsTreeProvider } from '../providers/logsTreeProvider';
import { createScreenshotsWatcher } from './screenshotsWatcher';
import { createLogsWatcher } from './logWatcher';
import { createFileWatcher } from './fileWatcher';
import { replaceWatchers } from './watcherStore';
import { clearProjectConfigurationCache, getProjectConfigPattern } from './projectConfiguration';

/**
 * Watch the `extesterRunner` settings and the ExTester configuration file of each workspace root,
 * and keep the views and file watchers in line with them.
 *
 * At startup only the watchers are created: the views have already loaded their content.
 */
export function settingsWatcher(
	context: vscode.ExtensionContext,
	testFileDiscovery: TestFileDiscovery,
	screenshotsDataProvider: ScreenshotsTreeProvider,
	logsDataProvider: LogsTreeProvider,
	logger: Logger,
) {
	const createResourceWatchers = () => {
		createLogsWatcher(context, logsDataProvider, logger);
		createScreenshotsWatcher(context, screenshotsDataProvider, logger);
	};
	const createWatchers = () => {
		try {
			createFileWatcher(context, testFileDiscovery, logger);
			createResourceWatchers();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.error(message);
			void vscode.window.showErrorMessage(message);
		}
	};
	const refresh = () => {
		clearProjectConfigurationCache();
		createWatchers();
		void testFileDiscovery.refresh();
		logsDataProvider.refresh();
		screenshotsDataProvider.refresh();
	};
	const watchProjectFiles = () =>
		replaceWatchers(context, 'configuration', () =>
			(vscode.workspace.workspaceFolders ?? []).flatMap((folder) => {
				const pattern = getProjectConfigPattern(folder);
				logger.debug(`Watching ExTester configuration file ${folder.uri.fsPath}: ${pattern}`);
				const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folder, pattern));
				return [watcher, watcher.onDidCreate(refresh), watcher.onDidChange(refresh), watcher.onDidDelete(refresh)];
			}),
		);
	watchProjectFiles();
	createWatchers();
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('extesterRunner')) {
				logger.debug('SettingsWatcher: Setting was changed, refreshing views.');
				if (event.affectsConfiguration('extesterRunner.configFile')) {
					watchProjectFiles();
				}
				refresh();
			}
		}),
		vscode.workspace.onDidChangeWorkspaceFolders(() => {
			watchProjectFiles();
			refresh();
		}),
		// A test run creates the logs and screenshots folders, which cannot be watched before they exist.
		vscode.tasks.onDidEndTask((event) => {
			if (event.execution.task.source === 'extester-runner') {
				createResourceWatchers();
			}
		}),
	);
}
