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
import * as path from 'node:path';
import * as os from 'node:os';
import { Logger } from '../logger/logger';
import { formatTimestampLabel } from '../utils/formatLabel';

/**
 * Base class for tree items displayed in the Logs and Screenshots views.
 *
 * Handles the common setup shared by both views:
 * - `tooltip` and `resourceUri` from the file path
 * - Human-readable timestamp label for timestamp-named directories
 * - Placeholder icon when no path is provided
 *
 * Subclasses supply the `contextValue` strings and the open command for files.
 */
export abstract class ResourceTreeItem extends vscode.TreeItem {
	/**
	 * @param label - Display label (raw folder/file name).
	 * @param filePath - Absolute path on disk. Empty string for placeholder items.
	 * @param isDir - Whether this item represents a directory.
	 * @param folderContextValue - `contextValue` applied to directory items.
	 * @param fileContextValue - `contextValue` applied to file items.
	 */
	constructor(
		public label: string,
		public readonly filePath: string,
		public readonly isDir: boolean,
		folderContextValue: string,
		fileContextValue: string,
	) {
		super(label, isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

		if (filePath) {
			this.tooltip = filePath;
			this.resourceUri = vscode.Uri.file(filePath);

			if (isDir) {
				this.iconPath = vscode.ThemeIcon.Folder;
				this.contextValue = folderContextValue;

				// Apply human-readable label for timestamp-named directories.
				const formatted = formatTimestampLabel(label);
				if (formatted) {
					this.label = formatted.label;
					this.description = formatted.description;
				}
			} else {
				this.iconPath = vscode.ThemeIcon.File;
				this.contextValue = fileContextValue;
				this.command = this.buildOpenCommand(filePath);
			}
		} else {
			// Placeholder item shown when the directory is empty or missing.
			this.iconPath = new vscode.ThemeIcon('warning');
		}
	}

	/** Returns the VS Code command used to open a file item. Override to customise. */
	protected abstract buildOpenCommand(filePath: string): vscode.Command;
}

/**
 * Abstract base class for the Logs and Screenshots tree providers.
 *
 * Handles the common infrastructure shared by both views:
 * - EventEmitter / `onDidChangeTreeData`
 * - `refresh()` and `getTreeItem()`
 * - Base-path resolution from `extesterRunner.tempFolder`, `TEST_RESOURCES`, or OS temp dir
 *
 * Subclasses supply:
 * - `pathSuffix` — the sub-path appended to the base temp dir (e.g. `"screenshots"` or `"settings/logs"`)
 * - `resolveRootPath()` — a public alias used by command handlers
 */
export abstract class ResourceTreeProvider<T extends ResourceTreeItem> implements vscode.TreeDataProvider<T> {
	protected readonly _onDidChangeTreeData = new vscode.EventEmitter<T | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	protected readonly logger: Logger;

	constructor(logger: Logger, debugLabel: string) {
		this.logger = logger;
		this.logger.debug(`Initial ${debugLabel} tree provider constructed.`);
		this.refresh();
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: T): vscode.TreeItem {
		return element;
	}

	abstract getChildren(element?: T): Promise<T[]>;

	/**
	 * Resolves the root directory path for this view.
	 *
	 * Priority: `extesterRunner.tempFolder` setting → `TEST_RESOURCES` env var → OS temp dir.
	 * Relative values are resolved against the first workspace folder.
	 *
	 * @param suffix - Sub-path appended to the base temp directory.
	 */
	protected resolveBasePath(suffix: string): string {
		const configuration = vscode.workspace.getConfiguration('extesterRunner');
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

		const tempDirSettings = configuration.get<string>('tempFolder')?.trim();
		const envTempDir = process.env.TEST_RESOURCES?.trim();

		let baseTempDir: string | undefined = tempDirSettings ?? envTempDir;

		if (baseTempDir && baseTempDir.length > 0) {
			baseTempDir = path.isAbsolute(baseTempDir) ? baseTempDir : path.join(workspaceFolder ?? '', baseTempDir);
		} else {
			baseTempDir = path.join(process.env.TMPDIR ?? os.tmpdir(), 'test-resources');
		}

		const finalPath = path.join(baseTempDir, ...suffix.split('/'));
		this.logger.debug(`Resolved ${suffix} directory: ${finalPath}`);
		return finalPath;
	}

	/** Public alias required by the {@link ResourceProvider} interface used in command handlers. */
	abstract resolveRootPath(): string;
}
