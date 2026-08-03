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
 * Provides a tree view for displaying screenshots within the ExTester VS Code extension.
 */
export class ScreenshotsTreeProvider extends ResourceTreeProvider<ScreenshotsResourcesItem> {
	constructor(logger: Logger) {
		super(logger, 'screenshots');
	}

	resolveRootPath(): string {
		return this.resolveScreenshotsPath();
	}

	resolveScreenshotsPath(): string {
		return this.resolveBasePath('screenshots');
	}

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

		const itemsWithStat: { item: ScreenshotsResourcesItem; mtime: number }[] = [];

		for (const file of files) {
			const fullPath = path.join(dirPath, file);
			const stat = await fs.promises.stat(fullPath);

			if (stat.isDirectory()) {
				itemsWithStat.push({ item: new ScreenshotsResourcesItem(file, fullPath, true), mtime: stat.mtimeMs });
			} else if (stat.isFile()) {
				itemsWithStat.push({ item: new ScreenshotsResourcesItem(file, fullPath, false), mtime: stat.mtimeMs });
			}
		}

		if (!element) {
			// Root level: sort newest-first by mtime.
			itemsWithStat.sort((a, b) => b.mtime - a.mtime);
		} else {
			// Nested level: directories first, then alphabetical.
			itemsWithStat.sort((a, b) => {
				if (a.item.isDir !== b.item.isDir) {
					return a.item.isDir ? -1 : 1;
				}
				return String(a.item.label).localeCompare(String(b.item.label));
			});
		}

		return itemsWithStat.map((x) => x.item);
	}
}

/**
 * Represents a tree item in the screenshots explorer.
 */
export class ScreenshotsResourcesItem extends ResourceTreeItem {
	constructor(label: string, filePath: string, isDir: boolean) {
		super(label, filePath, isDir, 'screenshotFolder', 'screenshotFile');
	}

	protected buildOpenCommand(filePath: string): vscode.Command {
		return {
			command: 'vscode.open',
			title: 'Open Screenshot',
			arguments: [vscode.Uri.file(filePath)],
		};
	}
}
