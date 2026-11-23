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
import { getRunnerConfiguration, shouldReportConfigurationError } from './projectConfiguration';
import { replaceWatchers } from './watcherStore';

/**
 * Creates (or re-creates) one file system watcher per workspace folder for its `testFileGlob`,
 * which refreshes the test view when test files are created, changed or deleted.
 *
 * @param {vscode.ExtensionContext} context - The extension context that disposes of the watchers.
 * @param {ExtesterTreeProvider} provider - The tree data provider of the test view.
 * @param {Logger} logger - The logging utility.
 */
export function createFileWatcher(context: vscode.ExtensionContext, provider: ExtesterTreeProvider, logger: Logger) {
	replaceWatchers(context, 'tests', () => {
		const patterns = (vscode.workspace.workspaceFolders ?? []).flatMap((folder) => {
			try {
				return [new vscode.RelativePattern(folder, getRunnerConfiguration(folder.uri).get<string>('testFileGlob') ?? '**/*.test.ts')];
			} catch (error) {
				if (shouldReportConfigurationError(folder.uri, 'watcher')) {
					logger.error(`Cannot watch tests in ${folder.name}: ${error instanceof Error ? error.message : String(error)}`);
				}
				return [];
			}
		});
		return patterns.flatMap((pattern) => {
			logger.debug(`Watching test pattern ${pattern.baseUri.fsPath}: ${pattern.pattern}`);
			const watcher = vscode.workspace.createFileSystemWatcher(pattern);
			const refresh = () => {
				logger.debug('Test files changed; refreshing tests.');
				void provider.refresh();
			};
			return [watcher, watcher.onDidCreate(refresh), watcher.onDidChange(refresh), watcher.onDidDelete(refresh)];
		});
	});
}
