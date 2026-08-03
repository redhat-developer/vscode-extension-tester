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

/**
 * Minimal interface satisfied by both `LogsTreeProvider` and `ScreenshotsTreeProvider`,
 * used to avoid duplicating command logic between the two views.
 */
export interface ResourceProvider {
	resolveRootPath(): string;
	refresh(): void;
}

/**
 * Represents a selectable item in a resource tree view (logs or screenshots).
 * Both `LogsResourcesItem` and `ScreenshotsResourcesItem` satisfy this shape.
 */
export interface ResourceItem {
	filePath: string;
}

/**
 * Clears all contents of the provider's root directory after user confirmation.
 *
 * @param provider - The tree provider whose root directory will be cleared.
 * @param label - Display name used in confirmation and error messages (e.g. `"logs"`).
 * @param logger - Logger instance.
 */
export async function clearResourceDirectory(provider: ResourceProvider, label: string, logger: Logger): Promise<void> {
	const answer = await vscode.window.showWarningMessage(`Clear all ${label}? This cannot be undone.`, { modal: true }, 'Clear');
	if (answer !== 'Clear') {
		return;
	}
	const dirPath = provider.resolveRootPath();
	try {
		await fs.promises.rm(dirPath, { recursive: true, force: true });
		logger.info(`Cleared ${label} directory: ${dirPath}`);
	} catch (error) {
		logger.error(`Failed to clear ${label}: ${error}`);
		vscode.window.showErrorMessage(`Failed to clear ${label}: ${error}`);
	}
	provider.refresh();
}

/**
 * Deletes a single file or folder after user confirmation.
 *
 * @param item - The tree item to delete. Silently returns if `filePath` is absent.
 * @param provider - The tree provider to refresh after deletion.
 * @param logger - Logger instance.
 */
export async function deleteResourceItem(item: ResourceItem | undefined, provider: ResourceProvider, logger: Logger): Promise<void> {
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
		logger.info(`Deleted item: ${item.filePath}`);
	} catch (error) {
		logger.error(`Failed to delete item: ${error}`);
		vscode.window.showErrorMessage(`Failed to delete '${name}': ${error}`);
	}
	provider.refresh();
}

/**
 * Opens the provider's root directory in the OS file manager.
 * Shows an informational message if the directory does not exist yet.
 *
 * @param provider - The tree provider whose root directory will be revealed.
 * @param logger - Logger instance.
 */
export async function revealResourceDirectory(provider: ResourceProvider, logger: Logger): Promise<void> {
	const dirPath = provider.resolveRootPath();
	if (!fs.existsSync(dirPath)) {
		vscode.window.showInformationMessage('No directory found yet.');
		return;
	}
	logger.debug(`Revealing directory: ${dirPath}`);
	await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(dirPath));
}

/**
 * Opens a specific tree item in the OS file manager.
 *
 * @param item - The tree item to reveal. Silently returns if `filePath` is absent.
 * @param logger - Logger instance.
 */
export async function revealResourceItem(item: ResourceItem | undefined, logger: Logger): Promise<void> {
	if (!item?.filePath) {
		return;
	}
	logger.debug(`Revealing item: ${item.filePath}`);
	await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(item.filePath));
}
