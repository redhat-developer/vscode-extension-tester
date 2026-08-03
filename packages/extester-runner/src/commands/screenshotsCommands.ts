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
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '../logger/logger';
import { ScreenshotsTreeProvider, ScreenshotsResourcesItem } from '../providers/screenshotsTreeProvider';

/**
 * Registers Screenshots view related commands for the VS Code extension.
 *
 * This function registers commands for refreshing and clearing the screenshot tree view.
 *
 * @param {vscode.ExtensionContext} context - The extension context, used for registering commands.
 * @param {ScreenshotsTreeProvider} screenshotDataProvider - The tree data provider responsible for managing the screenshot view.
 * @param {Logger} logger - The logging utility for debugging and tracking command execution.
 */
export function registerScreenshotsCommands(context: vscode.ExtensionContext, screenshotDataProvider: ScreenshotsTreeProvider, logger: Logger) {
	context.subscriptions.push(
		/**
		 * Registers the `extester-runner.refreshScreenshots` command.
		 * This command refreshes the screenshots view by triggering an update on the tree data provider.
		 */
		vscode.commands.registerCommand('extester-runner.refreshScreenshots', async () => {
			logger.debug('Command triggered: extester-runner.refreshScreenshots');
			screenshotDataProvider.refresh();
		}),
		/**
		 * Registers the `extester-runner.clearScreenshots` command.
		 * Asks for confirmation then removes all files and folders inside the resolved screenshots directory.
		 */
		vscode.commands.registerCommand('extester-runner.clearScreenshots', async () => {
			logger.debug('Command triggered: extester-runner.clearScreenshots');
			const answer = await vscode.window.showWarningMessage('Clear all screenshots? This cannot be undone.', { modal: true }, 'Clear');
			if (answer !== 'Clear') {
				return;
			}
			const screenshotsPath = screenshotDataProvider.resolveScreenshotsPath();
			try {
				await fs.promises.rm(screenshotsPath, { recursive: true, force: true });
				logger.info(`Cleared screenshots directory: ${screenshotsPath}`);
			} catch (error) {
				logger.error(`Failed to clear screenshots: ${error}`);
				vscode.window.showErrorMessage(`Failed to clear screenshots: ${error}`);
			}
			screenshotDataProvider.refresh();
		}),
		/**
		 * Registers the `extester-runner.deleteScreenshotsItem` command.
		 * Asks for confirmation then removes the selected file or folder from the screenshots directory.
		 */
		vscode.commands.registerCommand('extester-runner.deleteScreenshotsItem', async (item: ScreenshotsResourcesItem) => {
			logger.debug(`Command triggered: extester-runner.deleteScreenshotsItem on ${item?.filePath}`);
			if (!item?.filePath) {
				return;
			}
			const name = path.basename(item.filePath);
			const answer = await vscode.window.showWarningMessage(`Delete '${name}'? This cannot be undone.`, { modal: true }, 'Delete');
			if (answer !== 'Delete') {
				return;
			}
			try {
				await fs.promises.rm(item.filePath, { recursive: true, force: true });
				logger.info(`Deleted screenshots item: ${item.filePath}`);
			} catch (error) {
				logger.error(`Failed to delete screenshots item: ${error}`);
				vscode.window.showErrorMessage(`Failed to delete '${name}': ${error}`);
			}
			screenshotDataProvider.refresh();
		}),
		/**
		 * Registers the `extester-runner.revealScreenshots` command.
		 * Opens the resolved screenshots root directory in the OS file manager.
		 */
		vscode.commands.registerCommand('extester-runner.revealScreenshots', async () => {
			logger.debug('Command triggered: extester-runner.revealScreenshots');
			const screenshotsPath = screenshotDataProvider.resolveScreenshotsPath();
			if (!fs.existsSync(screenshotsPath)) {
				vscode.window.showInformationMessage('No screenshots directory found yet.');
				return;
			}
			await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(screenshotsPath));
		}),
		/**
		 * Registers the `extester-runner.revealScreenshotsItem` command.
		 * Opens the selected screenshot file or folder in the OS file manager.
		 */
		vscode.commands.registerCommand('extester-runner.revealScreenshotsItem', async (item: ScreenshotsResourcesItem) => {
			logger.debug(`Command triggered: extester-runner.revealScreenshotsItem on ${item?.filePath}`);
			if (!item?.filePath) {
				return;
			}
			await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(item.filePath));
		}),
	);
}
