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
import { ScreenshotsTreeProvider, ScreenshotsResourcesItem } from '../providers/screenshotsTreeProvider';
import { clearResourceDirectory, deleteResourceItem, revealResourceDirectory, revealResourceItem } from './resourceCommands';

/**
 * Registers Screenshots view related commands for the VS Code extension.
 *
 * @param {vscode.ExtensionContext} context - The extension context, used for registering commands.
 * @param {ScreenshotsTreeProvider} screenshotDataProvider - The tree data provider responsible for managing the screenshot view.
 * @param {Logger} logger - The logging utility for debugging and tracking command execution.
 */
export function registerScreenshotsCommands(context: vscode.ExtensionContext, screenshotDataProvider: ScreenshotsTreeProvider, logger: Logger) {
	context.subscriptions.push(
		vscode.commands.registerCommand('extester-runner.refreshScreenshots', () => {
			logger.debug('Command triggered: extester-runner.refreshScreenshots');
			screenshotDataProvider.refresh();
		}),
		vscode.commands.registerCommand('extester-runner.clearScreenshots', () => {
			logger.debug('Command triggered: extester-runner.clearScreenshots');
			return clearResourceDirectory(screenshotDataProvider, 'screenshots', logger);
		}),
		vscode.commands.registerCommand('extester-runner.deleteScreenshotsItem', (item: ScreenshotsResourcesItem) => {
			logger.debug(`Command triggered: extester-runner.deleteScreenshotsItem on ${item?.filePath}`);
			return deleteResourceItem(item, screenshotDataProvider, logger);
		}),
		vscode.commands.registerCommand('extester-runner.revealScreenshots', () => {
			logger.debug('Command triggered: extester-runner.revealScreenshots');
			return revealResourceDirectory(screenshotDataProvider, logger);
		}),
		vscode.commands.registerCommand('extester-runner.revealScreenshotsItem', (item: ScreenshotsResourcesItem) => {
			logger.debug(`Command triggered: extester-runner.revealScreenshotsItem on ${item?.filePath}`);
			return revealResourceItem(item, logger);
		}),
	);
}
