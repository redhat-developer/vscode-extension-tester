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
 * Provides a tree view for displaying screenshots within the ExTester VS Code extension.
 * This class implements vscode.TreeDataProvider<ScreenshotsResourcesItem> and is responsible for:
 *  - Scanning and presenting a directory structure containing screenshots.
 *  - Allowing users to open screenshots files directly from the tree view.
 *  - Updating the screenshots tree view when changes occur.
 */
export class ScreenshotsTreeProvider implements vscode.TreeDataProvider<ScreenshotsResourcesItem> {
	private _onDidChangeTreeData = new vscode.EventEmitter<ScreenshotsResourcesItem | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private logger: Logger;

	/**
	 * Creates an instance of the `ScreenshotsTreeProvider`.
	 *
	 * @param {Logger} logger - The logging utility for debugging and tracking file operations.
	 */
	constructor(logger: Logger) {
		this.logger = logger;
		this.logger.debug('Initial screenshots tree provider constructed.');
		this.refresh();
	}

	/**
	 * Refreshes the logs tree view.
	 */
	refresh(): void {
		this.logger.debug('Refreshing screenshots tree...');
		this._onDidChangeTreeData.fire(undefined);
	}

	/**
	 * Dynamically resolves the screenshots path used for displaying screenshots files in the tree view.
	 *
	 * This ensures that the screenshots path always reflects the most up-to-date configuration,
	 * even if the log directory changes during runtime.
	 *
	 * @returns {string} The resolved absolute path to the screenshots directory (`screenshots`).
	 */
	private resolveScreenshotsPath(): string {
		const configuration = vscode.workspace.getConfiguration('extesterRunner');
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

		const tempDirSettings = configuration.get<string>('tempFolder')?.trim();
		const envTempDir = process.env.TEST_RESOURCES?.trim();

		let baseTempDir: string | undefined = tempDirSettings || envTempDir;

		if (baseTempDir && baseTempDir.length > 0) {
			baseTempDir = path.isAbsolute(baseTempDir) ? baseTempDir : path.join(workspaceFolder || '', baseTempDir);
		} else {
			baseTempDir = path.join(process.env.TMPDIR || require('os').tmpdir(), 'test-resources');
		}

		const finalPath = path.join(baseTempDir, 'screenshots');
		this.logger.debug('Resolved screenshots directory: ' + finalPath);
		return finalPath;
	}

	/**
	 * Retrieves the `vscode.TreeItem` representation for each log resource item.
	 *
	 * @param {ScreenshotsResourcesItem} element - The screenshot item to display.
	 * @returns {vscode.TreeItem} - The corresponding tree item.
	 */
	getTreeItem(element: ScreenshotsResourcesItem): vscode.TreeItem {
		return element;
	}

	/**
	 * Retrieves child elements for the screenshots tree view.
	 *
	 * In case the directory doesn't exist or is empty, an empty array is returned.
	 *
	 * @param {ScreenshotsResourcesItem} [element] - Optional parent tree element to retrieve children from.
	 * @returns {Promise<ScreenshotsResourcesItem[]>} A promise resolving to an array of tree items representing screenshots.
	 */
	async getChildren(element?: ScreenshotsResourcesItem): Promise<ScreenshotsResourcesItem[]> {
		const dirPath = element ? element.filePath : this.resolveScreenshotsPath();

		if (!fs.existsSync(dirPath)) {
			this.logger.debug(`Directory does not exist: ${dirPath}`);
			return [new ScreenshotsResourcesItem('No screenshots', '', false)];
		}

		const files = await fs.promises.readdir(dirPath);

		if (files.length === 0) {
			return [new ScreenshotsResourcesItem('No screenshots', '', false)];
		}

		const items: ScreenshotsResourcesItem[] = [];

		for (const file of files) {
			const fullPath = path.join(dirPath, file);
			const stat = await fs.promises.stat(fullPath);

			if (stat.isDirectory()) {
				// This is a timestamp folder
				items.push(new ScreenshotsResourcesItem(file, fullPath, true));
			} else if (stat.isFile()) {
				// This is a screenshot file
				items.push(new ScreenshotsResourcesItem(file, fullPath, false));
			}
		}

		// Sort directories first, then files
		items.sort((a, b) => {
			if (a.isDirectory !== b.isDirectory) {
				return a.isDirectory ? -1 : 1;
			}
			return a.label.localeCompare(b.label);
		});

		return items;
	}
}

/**
 * Represents a tree item in the screenshots explorer.
 */
class ScreenshotsResourcesItem extends vscode.TreeItem {
	/**
	 * Creates an instance of the `ScreenshotsResourcesItem`
	 * @param {string} label - The label displayed in the tree view.
	 * @param {string} filePath - The file path associated with this item.
	 * @param {boolean} isDirectory - Indicates whether this item represents a directory.
	 */
	constructor(
		public readonly label: string,
		public readonly filePath: string,
		public readonly isDirectory: boolean,
	) {
		super(label, isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

		if (filePath) {
			this.tooltip = filePath;
			this.resourceUri = vscode.Uri.file(filePath);

			if (isDirectory) {
				// This is a timestamp folder
				this.iconPath = vscode.ThemeIcon.Folder;
				this.contextValue = 'screenshotFolder';
			} else {
				// This is a screenshot file
				this.iconPath = vscode.ThemeIcon.File;
				this.contextValue = 'screenshotFile';

				this.command = {
					command: 'vscode.open',
					title: 'Open Screenshot',
					arguments: [vscode.Uri.file(filePath)],
				};
			}
		} else {
			// placeholder item
			this.iconPath = new vscode.ThemeIcon('warning');
		}
	}
}
