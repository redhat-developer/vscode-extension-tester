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
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../logger/logger';

/**
 * Provides a tree view for displaying log files and directories within the ExTester VS Code extension.
 * This class implements vscode.TreeDataProvider<LogsResourcesItem> and is responsible for:
 *  - Scanning and presenting a directory structure containing logs.
 *  - Dynamically updating the view based on configuration settings.
 *  - Allowing users to open log files directly from the tree view.
 *  - Updating the logs tree view when changes occur.
 */
export class LogsTreeProvider implements vscode.TreeDataProvider<LogsResourcesItem> {
	private readonly _onDidChangeTreeData = new vscode.EventEmitter<LogsResourcesItem | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private readonly logger: Logger;

	/**
	 * Creates an instance of the `LogsTreeProvider`.
	 *
	 * @param {Logger} logger - The logging utility for debugging and tracking file operations.
	 */
	constructor(logger: Logger) {
		this.logger = logger;
		this.logger.debug('Initial logs tree provider constructed.');
		this.refresh();
	}

	/**
	 * Refreshes the logs tree view.
	 */
	refresh(): void {
		this.logger.debug('Refreshing logs tree...');
		this._onDidChangeTreeData.fire(undefined);
	}

	/**
	 * Dynamically resolves the log path used for displaying log files in the tree view.
	 *
	 * This ensures that the logs path always reflects the most up-to-date configuration,
	 * even if the log directory changes during runtime.
	 *
	 * @returns {string} The resolved absolute path to the logs directory (`settings/logs`).
	 */
	private resolveLogPath(): string {
		const configuration = vscode.workspace.getConfiguration('extesterRunner');
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

		const tempDirSettings = configuration.get<string>('tempFolder')?.trim();
		const envTempDir = process.env.TEST_RESOURCES?.trim();

		let baseTempDir: string | undefined = tempDirSettings ?? envTempDir;

		if (baseTempDir && baseTempDir.length > 0) {
			baseTempDir = path.isAbsolute(baseTempDir) ? baseTempDir : path.join(workspaceFolder ?? '', baseTempDir);
		} else {
			baseTempDir = path.join(process.env.TMPDIR ?? require('os').tmpdir(), 'test-resources');
		}

		const finalPath = path.join(baseTempDir, 'settings', 'logs');
		this.logger.debug('Resolved logs directory: ' + finalPath);
		return finalPath;
	}

	/**
	 * Retrieves the `vscode.TreeItem` representation for each log resource item.
	 *
	 * @param {LogsResourcesItem} element - The log resource item to display.
	 * @returns {vscode.TreeItem} - The corresponding tree item.
	 */
	getTreeItem(element: LogsResourcesItem): vscode.TreeItem {
		return element;
	}

	/**
	 * Provides child elements for the tree view.
	 *
	 * This method scans directories and files under the log resources folder, creating a structured hierarchy.
	 * It respects the user-configurable setting to optionally hide empty directories.
	 *
	 * @param {LogsResourcesItem} [element] - The parent element, if available.
	 * @returns {Promise<LogsResourcesItem[]>} - A promise resolving to an array of log resource items.
	 */
	async getChildren(element?: LogsResourcesItem): Promise<LogsResourcesItem[]> {
		const dirPath = element ? element.filePath : this.resolveLogPath();
		const hideEmptyFolders = vscode.workspace.getConfiguration('extesterRunner').get<boolean>('hideEmptyLogFolders', true);

		if (!fs.existsSync(dirPath)) {
			this.logger.debug(`Directory does not exist: ${dirPath}`);
			return [new LogsResourcesItem('No logs', '', false, true)];
		}

		const entries = fs.readdirSync(dirPath, { withFileTypes: true });

		const items = entries
			.map((entry) => {
				const entryPath = path.join(dirPath, entry.name);
				const isDir = entry.isDirectory();
				const isEmpty = isDir && fs.readdirSync(entryPath).length === 0;

				if (hideEmptyFolders && isDir && isEmpty) {
					return null;
				}

				return new LogsResourcesItem(entry.name, entryPath, isDir, isEmpty);
			})
			.filter(Boolean) as LogsResourcesItem[];

		if (items.length === 0) {
			return [new LogsResourcesItem('No logs', '', false, true)];
		}

		return items;
	}
}

/**
 * Represents a tree item in the logs explorer.
 */
class LogsResourcesItem extends vscode.TreeItem {
	/**
	 * Creates an instance of the `LogsResourcesItem`
	 * @param {string} label - The label displayed in the tree view.
	 * @param {string} filePath - The file path associated with this item.
	 * @param {boolean} isDir - Whether this item represents a folder.
	 * @param {boolean} isEmpty - Flag to track empty folders.
	 */
	constructor(
		public label: string,
		public filePath: string,
		public isDir: boolean,
		public isEmpty: boolean,
	) {
		super(label, isDir && !isEmpty ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

		if (filePath) {
			this.tooltip = filePath;
			this.resourceUri = vscode.Uri.file(filePath);

			this.iconPath = isDir ? new vscode.ThemeIcon('symbol-folder') : new vscode.ThemeIcon('file');

			if (!isDir) {
				this.command = {
					command: 'vscode.open',
					title: 'Open File',
					arguments: [vscode.Uri.file(filePath)],
				};
			}
		} else {
			// placeholder item
			this.iconPath = new vscode.ThemeIcon('warning');
		}
	}
}
