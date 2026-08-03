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
import { ResourceTreeItem, ResourceTreeProvider } from './resourceTreeProvider';

/**
 * Provides a tree view for displaying log files and directories within the ExTester VS Code extension.
 */
export class LogsTreeProvider extends ResourceTreeProvider<LogsResourcesItem> {
	constructor(logger: Logger) {
		super(logger, 'logs');
	}

	resolveRootPath(): string {
		return this.resolveLogPath();
	}

	resolveLogPath(): string {
		return this.resolveBasePath('settings/logs');
	}

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

		// Sort root-level items newest-first by mtime; leave nested items (children of a folder) unsorted.
		if (!element) {
			const withMtime = await Promise.all(
				items.map(async (item) => {
					try {
						const stat = await fs.promises.stat(item.filePath);
						return { item, mtime: stat.mtimeMs };
					} catch {
						return { item, mtime: 0 };
					}
				}),
			);
			withMtime.sort((a, b) => b.mtime - a.mtime);
			return withMtime.map((x) => x.item);
		}

		return items;
	}
}

/**
 * Represents a tree item in the logs explorer.
 */
export class LogsResourcesItem extends ResourceTreeItem {
	constructor(
		label: string,
		filePath: string,
		isDir: boolean,
		public readonly isEmpty: boolean,
	) {
		super(label, filePath, isDir, 'logFolder', 'logFile');

		// Override collapsible state: empty log directories are not expandable.
		if (isDir && isEmpty) {
			this.collapsibleState = vscode.TreeItemCollapsibleState.None;
		}

		// Log directories use a different icon than the base class default.
		if (filePath && isDir) {
			this.iconPath = new vscode.ThemeIcon('symbol-folder');
		}
	}

	protected buildOpenCommand(filePath: string): vscode.Command {
		return {
			command: 'vscode.open',
			title: 'Open File',
			arguments: [vscode.Uri.file(filePath)],
		};
	}
}
