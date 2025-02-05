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

/**
 * Represents a tree item in the test explorer.
 *
 * This class extends `vscode.TreeItem` and is used to represent both test files and folders
 * in the tree view. It provides properties and behavior for handling test navigation and
 * organization within the test explorer.
 */
export class TreeItem extends vscode.TreeItem {
	children: TreeItem[] | undefined; // child items of this tree item, if it is a folder
	public lineNumber?: number; // line number associated with this item
	public folderPath?: string; // folder path associated with this item

	/**
	 * Creates an instance of the `TreeItem`.
	 *
	 * @param {string} label - The label displayed in the tree view.
	 * @param {vscode.TreeItemCollapsibleState} collapsibleState - The collapsible state of the item.
	 * @param {boolean} isFolder - Whether this item represents a folder.
	 * @param {string} [filePath] - The file path associated with this item, if applicable.
	 * @param {number} [lineNumber] - The line number in the file associated with this item.
	 * @param {string} [folderPath] - The folder path associated with this item.
	 */
	constructor(
		label: string,
		collapsibleState: vscode.TreeItemCollapsibleState,
		public isFolder: boolean,
		public filePath?: string,
		lineNumber?: number,
		folderPath?: string,
	) {
		super(label, collapsibleState);
		this.lineNumber = lineNumber;
		this.folderPath = folderPath;

		// Set details based on type of item.
		this.iconPath = isFolder ? new vscode.ThemeIcon('folder') : new vscode.ThemeIcon('file');
		this.contextValue = isFolder ? 'folder' : 'file';
		this.tooltip = isFolder ? folderPath : filePath;

		// If the item represents a file, assign a command to open it in the editor
		if (!isFolder && filePath) {
			this.command = {
				command: 'extesterRunner.openTestItem',
				title: 'Open Test Item',
				arguments: [this.filePath, this.lineNumber],
			};
		}
	}
}
