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
import * as path from 'path';
import { parseTestFile } from '../utils/parser';
import { TestBlock } from '../types/testTypes';
import { TreeItem } from '../types/treeItem';
import { Logger } from '../logger/logger';

/**
 * Provides test file and test structure data for the ExTester test explorer tree view.
 *
 * This class implements `vscode.TreeDataProvider<TreeItem>` and is responsible for:
 * - Discovering test files in the workspace.
 * - Parsing test files to extract `describe` and `it` blocks.
 * - Structuring test data into a hierarchical tree format.
 * - Updating the test tree view when changes occur.
 */
export class ExtesterTreeProvider implements vscode.TreeDataProvider<TreeItem> {
	// Event emitter to signal when the tree data needs to be refreshed..
	private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	private files: vscode.Uri[] = []; // stores test files found in the workspace
	private parsedFiles: Map<string, TestBlock[]> = new Map(); // cache for parsed file contents
	private hasTestFiles: boolean = false; // flag to track if any test files are found

	private logger: Logger;

	/**
	 * Creates an instance of the `ExtesterTreeProvider`.
	 *
	 * @param {Logger} logger - The logging utility for debugging and tracking file operations.
	 */
	constructor(logger: Logger) {
		this.logger = logger;
		this.logger.debug('Initial tests tree provider constructed.');
		this.refresh(); // necessary to load initial data
	}

	/**
	 * Refreshes the test tree view.
	 *
	 * This method re-scans the workspace for test files, updates the test structure, and
	 * triggers a UI refresh. It also ensures that the test tree state is updated.
	 *
	 * @returns {Promise<void>} - Resolves when the refresh is complete.
	 */
	async refresh(): Promise<void> {
		this.logger.debug('Refreshing test tree...');
		this.parsedFiles.clear();
		this.files = [];

		await this.findTestFiles();
		await vscode.commands.executeCommand('setContext', 'extesterRunner.hasTestFiles', this.hasTestFiles); // change availability of run all button
		this.logger.debug(`setContext for extesterRunner.hasTestFiles to ${this.hasTestFiles}`);

		// Force UI update after a slight delay to ensure state is applied.
		this._onDidChangeTreeData.fire();
		setTimeout(() => {
			vscode.commands.executeCommand('setContext', 'extesterRunner.hasTestFiles', this.hasTestFiles);
			this.logger.debug(`setContext for extesterRunner.hasTestFiles to ${this.hasTestFiles}`);
		}, 100);
	}

	/**
	 * Retrieves the tree item representation of a given element.
	 *
	 * @param {TreeItem} element - The tree item to render.
	 * @returns {vscode.TreeItem} - The visual representation of the tree item.
	 */
	getTreeItem(element: TreeItem): vscode.TreeItem {
		return element;
	}

	/**
	 * Retrieves the children of a given tree item.
	 *
	 * This method is responsible for building the tree hierarchy by returning test folders,
	 * files, or parsed test structures depending on the selected item.
	 *
	 * @param {TreeItem} [element] - The parent element, if any.
	 * @returns {Promise<TreeItem[]>} - The list of child items.
	 */
	async getChildren(element?: TreeItem): Promise<TreeItem[]> {
		if (!element) {
			// If no files found, put info message to view.
			if (!this.hasTestFiles) {
				const noFilesItem = new TreeItem('No tests', vscode.TreeItemCollapsibleState.None, false);
				noFilesItem.contextValue = 'noFiles';
				noFilesItem.iconPath = new vscode.ThemeIcon('warning');
				return [noFilesItem];
			}

			// Return top-level folders.
			const folderMap = this.groupFilesByFolder();
			let folders = Array.from(folderMap.keys()).map((folder) => {
				const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
				const folderPath = path.join(workspaceFolder, folder);

				const configuration = vscode.workspace.getConfiguration('extesterRunner');
				const ignorePathPart = configuration.get<string>('ignorePathPart') || '';
				const displayName = folder.startsWith(ignorePathPart) ? folder.substring(ignorePathPart.length) : folder;

				const treeItem = new TreeItem(displayName, vscode.TreeItemCollapsibleState.Collapsed, true, undefined, undefined, folderPath);
				treeItem.id = folder;
				return treeItem;
			});

			// Sort folders alphabetically.
			return folders.sort((a, b) => {
				const labelA = typeof a.label === 'string' ? a.label : a.label?.label || '';
				const labelB = typeof b.label === 'string' ? b.label : b.label?.label || '';
				return labelA.localeCompare(labelB);
			});
		} else if (element.isFolder && typeof element.label === 'string') {
			const actualFolderName = element.id || element.label; // if display name is not same (setting for hiding part of path is used)
			const folderMap = this.groupFilesByFolder();
			const files = folderMap.get(actualFolderName) || [];
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

			let fileItems = await Promise.all(
				files.map(async (file) => {
					const filePath = path.join(workspaceFolder, actualFolderName, file);
					const parsedContent = await this.getParsedContent(filePath);

					return new TreeItem(
						file,
						parsedContent.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, // only expandable if it has content
						false,
						filePath,
					);
				}),
			);

			// Sort files alphabetically.
			return fileItems.sort((a, b) => {
				const labelA = typeof a.label === 'string' ? a.label : a.label?.label || '';
				const labelB = typeof b.label === 'string' ? b.label : b.label?.label || '';
				return labelA.localeCompare(labelB);
			});
		} else if (!element.isFolder && element.filePath) {
			const parsedContent = await this.getParsedContent(element.filePath);
			return this.convertTestBlocksToTreeItems(parsedContent);
		} else if (element.children) {
			return element.children;
		}

		return [];
	}
	/**
	 * Finds test files in the workspace.
	 *
	 * Searches for test files using a configurable glob pattern while excluding
	 * `node_modules` by default.
	 */
	private async findTestFiles(): Promise<void> {
		try {
			this.logger.debug('Looking for test files.');
			const configuration = vscode.workspace.getConfiguration('extesterRunner');
			const testFileGlob = configuration.get<string>('testFileGlob') || '**/*.test.ts';
			const excludeGlob = configuration.get<string>('excludeGlob') || '**/node_modules/**';

			const files = await vscode.workspace.findFiles(testFileGlob, excludeGlob);
			this.files = files;
			this.hasTestFiles = this.files.length > 0;

			this._onDidChangeTreeData.fire(); // refresh tree view
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(`Error finding test files: ${error.message}`);
				vscode.window.showErrorMessage(`Error finding test files: ${error.message}`);
			} else {
				this.logger.error(`Unknown error occurred while finding test files.`);
				vscode.window.showErrorMessage(`Unknown error occurred while finding test files.`);
			}
		}
	}

	/**
	 * Groups test files by their parent folder.
	 *¨
	 * @returns {Map<string, string[]>} - A mapping of folder names to their contained files.
	 */
	private groupFilesByFolder(): Map<string, string[]> {
		const folderMap = new Map<string, string[]>();
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

		this.files.forEach((fileUri) => {
			const relativePath = path.relative(workspaceFolder, fileUri.fsPath);
			const folder = path.dirname(relativePath);
			const fileName = path.basename(relativePath);

			if (!folderMap.has(folder)) {
				folderMap.set(folder, []);
			}
			folderMap.get(folder)?.push(fileName);
		});

		return folderMap;
	}

	/**
	 * Retrieves and caches parsed test file contents.
	 *
	 * @param {string} filePath - The file path to parse.
	 * @returns {Promise<TestBlock[]>} - Parsed test structure.
	 */
	private async getParsedContent(filePath: string): Promise<TestBlock[]> {
		if (this.parsedFiles.has(filePath)) {
			return this.parsedFiles.get(filePath) || [];
		}

		try {
			this.logger.debug(`Parsing file ${filePath}`);
			const uri = vscode.Uri.file(filePath);
			const parsedContent = await parseTestFile(uri, this.logger);
			this.parsedFiles.set(filePath, parsedContent);
			return parsedContent;
		} catch (error) {
			this.logger.error(`Error parsing file ${filePath}: ${error}`);
			vscode.window.showErrorMessage(`Error parsing file ${filePath}: ${error}`);
			return [];
		}
	}

	/**
	 * Converts a list of parsed test blocks into `TreeItem` instances for the test explorer view.
	 *
	 * This method processes both `describe` and `it` blocks, creating a hierarchical structure
	 * for the tree view. It assigns appropriate icons and context values based on test modifiers
	 * (e.g., `only`, `skip`).
	 *
	 * @param {TestBlock[]} testBlocks - The parsed test blocks representing the test structure.
	 * @returns {TreeItem[]} - A list of `TreeItem` instances representing the test hierarchy.
	 */
	private convertTestBlocksToTreeItems(testBlocks: TestBlock[]): TreeItem[] {
		return testBlocks.map((block) => {
			let describeIcon;

			// Select the appropriate icon for an `describe` test case based on its modifier.
			const getThemeIcon = (modifier?: string) => {
				return modifier === 'only'
					? new vscode.ThemeIcon('bracket-dot', new vscode.ThemeColor('extesterrunner.only'))
					: new vscode.ThemeIcon('bracket-error', new vscode.ThemeColor('extesterrunner.skip'));
			};

			const modifier = block.modifier ?? undefined;
			const parentModifier = block.parentModifier ?? undefined;

			// Assign icon based on modifier.
			describeIcon = modifier || parentModifier ? getThemeIcon(modifier ?? parentModifier) : new vscode.ThemeIcon('bracket');

			// Recursively process nested `describe` blocks.
			const nestedDescribeItems = this.convertTestBlocksToTreeItems(block.children);

			// Create TreeItems for `it` tests inside this `describe` block.
			const itItems = block.its.map((it) => {
				let itIcon;

				// Select the appropriate icon for an `it` test case based on its modifier.
				const getItIcon = (modifier?: string) => {
					return modifier === 'only'
						? new vscode.ThemeIcon('variable', new vscode.ThemeColor('extesterrunner.only'))
						: new vscode.ThemeIcon('variable', new vscode.ThemeColor('extesterrunner.skip'));
				};

				const itModifier = it.modifier ?? undefined;
				const itParentModifier = it.parentModifier ?? undefined;

				itIcon = itModifier || itParentModifier ? getItIcon(itModifier ?? itParentModifier) : new vscode.ThemeIcon('variable');

				// Create a TreeItem for the `it` test case.
				const itItem = new TreeItem(
					`${it.name} ${it.modifier ? `[${it.modifier}]` : ''}`,
					vscode.TreeItemCollapsibleState.None,
					false,
					undefined, // no file path for `it`
					it.line,
				);

				// Assign metadata to the `it` block.
				itItem.tooltip = 'it';
				itItem.contextValue = 'itBlock';
				itItem.iconPath = itIcon;

				// Define command for opening the test item in the editor.
				itItem.command = {
					command: 'extesterRunner.openTestItem',
					title: 'Open Test Item',
					arguments: [it.filePath, it.line],
				};

				return itItem;
			});

			// Determine collapsible state based on child elements.
			const collapsibleState =
				nestedDescribeItems.length > 0 || itItems.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;

			// Create a TreeItem for the `describe` block.
			const describeItem = new TreeItem(
				`${block.describe} ${block.modifier ? `[${block.modifier}]` : ''}`,
				collapsibleState,
				false,
				undefined, // no file path for `describe` to avoid infinite parsing loop
				block.line,
			);

			// Assign metadata to the `describe` block.
			describeItem.tooltip = 'describe';
			describeItem.contextValue = 'describeBlock';
			describeItem.iconPath = describeIcon;

			// Define command for opening the test item in the editor.
			describeItem.command = {
				command: 'extesterRunner.openTestItem',
				title: 'Open Test Item',
				arguments: [block.filePath, block.line],
			};

			// Attach all child items (both `it` blocks and nested `describe` blocks).
			describeItem.children = [...itItems, ...nestedDescribeItems];

			return describeItem;
		});
	}

	/**
	 * Recursively collects all absolute paths for folders and files in the test tree.
	 *
	 * @returns {Promise<string[]>} - An array of absolute paths.
	 */
	async getAllAbsolutePaths(): Promise<string[]> {
		const paths: string[] = [];

		// Recursive helper function to traverse tree items.
		const collectPaths = async (item: TreeItem): Promise<void> => {
			// If the tree item has an absolute path, add it to our list.
			if (item.filePath) {
				paths.push(item.filePath);
			}

			// Get children if not already loaded.
			let children: TreeItem[] = item.children || (await this.getChildren(item));

			// Recursively traverse each child.
			for (const child of children) {
				await collectPaths(child);
			}
		};

		// Start by retrieving the top-level tree items.
		const rootItems = await this.getChildren();
		for (const item of rootItems) {
			await collectPaths(item);
		}
		return paths;
	}
}
