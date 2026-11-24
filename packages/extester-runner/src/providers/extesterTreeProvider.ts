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
import { ItBlock, TestBlock } from '../types/testTypes';
import { countTests, FOCUSED_TEST_PATTERN, pluralize } from '../utils/testCounts';
import { TreeItem } from '../types/treeItem';
import { Logger } from '../logger/logger';
import { getRunnerConfiguration, shouldReportConfigurationError } from '../utils/projectConfiguration';

type TreeDataType = TreeItem | undefined | void;

/**
 * Context key holding the absolute paths of all discovered test files.
 * Editor and explorer menus use it to offer "Run Test File" only for test files.
 */
export const TEST_FILES_CONTEXT_KEY = 'extesterRunner.testFiles';

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
	private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeDataType> = new vscode.EventEmitter<TreeDataType>();
	readonly onDidChangeTreeData: vscode.Event<TreeDataType> = this._onDidChangeTreeData.event;

	private refreshGeneration = 0;
	private files: vscode.Uri[] = []; // stores test files found in the workspace
	private readonly parsedFiles: Map<string, TestBlock[]> = new Map(); // cache for parsed file contents
	private readonly parseErrors: Map<string, string> = new Map(); // parse error message per file
	private hasTestFiles: boolean = false; // flag to track if any test files are found

	// Event emitter to signal which files contain focused tests (`.only`).
	private readonly _onDidChangeFocusedTests: vscode.EventEmitter<string[]> = new vscode.EventEmitter<string[]>();
	readonly onDidChangeFocusedTests: vscode.Event<string[]> = this._onDidChangeFocusedTests.event;

	private readonly logger: Logger;

	/**
	 * Creates an instance of the `ExtesterTreeProvider`.
	 *
	 * @param {Logger} logger - The logging utility for debugging and tracking file operations.
	 */
	private constructor(logger: Logger) {
		this.logger = logger;
		this.logger.debug('Initial tests tree provider constructed.');
	}

	/**
	 * Creates and initializes a new instance of ExtesterTreeProvider.
	 *
	 * @param {Logger} logger - The logging utility for debugging and tracking file operations.
	 * @returns {Promise<ExtesterTreeProvider>} - A promise that resolves to the initialized provider.
	 */
	static async create(logger: Logger): Promise<ExtesterTreeProvider> {
		const provider = new ExtesterTreeProvider(logger);
		await provider.refresh();
		return provider;
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
		this.parseErrors.clear();
		const generation = ++this.refreshGeneration;

		await this.findTestFiles(generation);
		if (generation !== this.refreshGeneration) {
			return;
		}
		await vscode.commands.executeCommand('setContext', 'extesterRunner.hasTestFiles', this.hasTestFiles); // change availability of run all button
		this.logger.debug(`setContext for extesterRunner.hasTestFiles to ${this.hasTestFiles}`);
		await vscode.commands.executeCommand(
			'setContext',
			TEST_FILES_CONTEXT_KEY,
			this.files.map((file) => file.fsPath),
		);
		void this.updateFocusedTests(generation);

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
			// If no files found, return nothing: the view shows its welcome content instead.
			if (!this.hasTestFiles) {
				return [];
			}

			// Return top-level folders.
			const folderMap = this.groupFilesByFolder();
			let folders = Array.from(folderMap.keys()).map((folder) => {
				const folderPath = folder;
				const displayName = folderLabel(folder);

				const treeItem = new TreeItem(displayName, vscode.TreeItemCollapsibleState.Collapsed, true, undefined, undefined, folderPath);
				treeItem.id = folder;
				treeItem.description = pluralize(folderMap.get(folder)?.length ?? 0, 'file');
				return treeItem;
			});

			// Sort folders alphabetically.
			return folders.sort((a, b) => {
				const labelA = typeof a.label === 'string' ? a.label : (a.label?.label ?? '');
				const labelB = typeof b.label === 'string' ? b.label : (b.label?.label ?? '');
				return labelA.localeCompare(labelB);
			});
		} else if (element.isFolder && typeof element.label === 'string') {
			const actualFolderName = element.id ?? element.label; // if display name is not same (setting for hiding part of path is used)
			const folderMap = this.groupFilesByFolder();
			const files = folderMap.get(actualFolderName) ?? [];

			let fileItems = await Promise.all(
				files.map(async (file) => {
					const filePath = path.join(actualFolderName, file);
					const parsedContent = await this.getParsedContent(filePath);

					const fileItem = new TreeItem(
						file,
						parsedContent.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, // only expandable if it has content
						false,
						filePath,
					);
					const parseError = this.parseErrors.get(filePath);
					if (parseError) {
						// Show the problem on the file instead of interrupting the user with a notification.
						fileItem.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
						fileItem.description = 'cannot parse';
						fileItem.tooltip = `${filePath}\n\nCannot parse this file: ${parseError}`;
					} else {
						fileItem.description = pluralize(countTests(parsedContent), 'test');
					}
					return fileItem;
				}),
			);

			// Sort files alphabetically.
			return fileItems.sort((a, b) => {
				const labelA = typeof a.label === 'string' ? a.label : (a.label?.label ?? '');
				const labelB = typeof b.label === 'string' ? b.label : (b.label?.label ?? '');
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
	private async findTestFiles(generation: number): Promise<void> {
		this.logger.debug('Looking for test files.');
		const discovered = await Promise.all(
			(vscode.workspace.workspaceFolders ?? []).map(async (folder) => {
				try {
					const configuration = getRunnerConfiguration(folder.uri);
					const files = await vscode.workspace.findFiles(
						new vscode.RelativePattern(folder, configuration.get<string>('testFileGlob') ?? '**/*.test.ts'),
						new vscode.RelativePattern(folder, configuration.get<string>('excludeGlob') ?? '**/node_modules/**'),
					);
					return files.filter((file) => vscode.workspace.getWorkspaceFolder(file)?.uri.toString() === folder.uri.toString());
				} catch (error) {
					// Report an invalid configuration file once, not on every refresh.
					if (generation === this.refreshGeneration && shouldReportConfigurationError(folder.uri, 'discovery')) {
						const message = `Error finding test files in ${folder.name}: ${error instanceof Error ? error.message : String(error)}`;
						this.logger.error(message);
						void vscode.window.showErrorMessage(message);
					}
				}
				return [];
			}),
		);
		if (generation === this.refreshGeneration) {
			this.files = discovered.flat();
			this.hasTestFiles = this.files.length > 0;
			this._onDidChangeTreeData.fire();
		}
	}

	/**
	 * Groups test files by their parent folder.
	 *¨
	 * @returns {Map<string, string[]>} - A mapping of folder names to their contained files.
	 */
	private groupFilesByFolder(): Map<string, string[]> {
		const folderMap = new Map<string, string[]>();

		this.files.forEach((fileUri) => {
			const folder = path.dirname(fileUri.fsPath);
			const fileName = path.basename(fileUri.fsPath);

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
			const message = error instanceof Error ? error.message : String(error);
			this.logger.error(`Error parsing file ${filePath}: ${message}`);
			this.parseErrors.set(filePath, message);
			this.parsedFiles.set(filePath, []); // do not parse the broken file again until the next refresh
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
	 * @param {string[]} [parentTitles] - The titles of the `describe` blocks that contain the blocks.
	 * @returns {TreeItem[]} - A list of `TreeItem` instances representing the test hierarchy.
	 */
	private convertTestBlocksToTreeItems(testBlocks: TestBlock[], parentTitles: string[] = []): TreeItem[] {
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
			const titles = [...parentTitles, block.describe];
			const nestedDescribeItems = this.convertTestBlocksToTreeItems(block.children, titles);

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
					it.name,
					vscode.TreeItemCollapsibleState.None,
					false,
					undefined, // no file path for `it`
					it.line,
				);

				// Assign metadata to the `it` block.
				itItem.description = it.modifier ?? undefined;
				itItem.tooltip = this.buildTooltip('it', it.name, it);
				itItem.contextValue = 'itBlock';
				itItem.iconPath = itIcon;
				itItem.runTarget = { file: it.filePath, titles: [...titles, it.name], isTest: true, line: it.line };

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
				block.describe,
				collapsibleState,
				false,
				undefined, // no file path for `describe` to avoid infinite parsing loop
				block.line,
			);

			// Assign metadata to the `describe` block.
			describeItem.description = block.modifier ?? undefined;
			describeItem.tooltip = this.buildTooltip('describe', block.describe, block);
			describeItem.contextValue = 'describeBlock';
			describeItem.iconPath = describeIcon;
			describeItem.runTarget = { file: block.filePath, titles, isTest: false, line: block.line };

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
	 * Builds the tooltip of a `describe` or `it` block: its kind, name, location and modifier.
	 *
	 * @param {string} kind - `describe` or `it`.
	 * @param {string} name - Name of the block.
	 * @param {TestBlock | ItBlock} block - The parsed block.
	 * @returns {string} The tooltip text.
	 */
	private buildTooltip(kind: string, name: string, block: TestBlock | ItBlock): string {
		const lines = [`${kind}: ${name}`, `${vscode.workspace.asRelativePath(block.filePath)}:${block.line}`];
		if (block.modifier) {
			lines.push(`Marked with .${block.modifier}`);
		} else if (block.parentModifier) {
			lines.push(`Inherits .${block.parentModifier} from a parent describe`);
		}
		return lines.join('\n');
	}

	/**
	 * Whether the file is one of the discovered test files.
	 *
	 * @param {string} filePath - Absolute path of the file.
	 * @returns {boolean} `true` when the file matches the test file pattern of its workspace folder.
	 */
	isTestFile(filePath: string): boolean {
		const normalized = path.normalize(filePath);
		return this.files.some((file) => path.normalize(file.fsPath) === normalized);
	}

	/**
	 * Looks for focused tests (`.only`) in the discovered files and reports the files that contain them.
	 * The files are scanned as text, so the check does not open documents or parse them.
	 *
	 * @param {number} generation - The refresh this scan belongs to; results of an outdated refresh are dropped.
	 */
	private async updateFocusedTests(generation: number): Promise<void> {
		const files = this.files;
		const focused = await Promise.all(
			files.map(async (file) => {
				try {
					const content = new TextDecoder().decode(await vscode.workspace.fs.readFile(file));
					return FOCUSED_TEST_PATTERN.test(content) ? file.fsPath : undefined;
				} catch (error) {
					this.logger.debug(`Cannot read ${file.fsPath} to look for .only: ${error}`);
					return undefined;
				}
			}),
		);
		if (generation === this.refreshGeneration) {
			this._onDidChangeFocusedTests.fire(focused.filter((file): file is string => file !== undefined));
		}
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

/**
 * The label of a folder of test files: its path relative to its workspace folder, without
 * `ignorePathPart`, and prefixed with the workspace folder name in a multi-root workspace.
 *
 * @param {string} folder - Absolute path of the folder.
 * @returns {string} The label.
 */
export function folderLabel(folder: string): string {
	const owner = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(folder));
	const relativeFolder = path.relative(owner?.uri.fsPath ?? '', folder);
	const ignorePathPart = getRunnerConfiguration(vscode.Uri.file(folder)).get<string>('ignorePathPart') ?? '';
	// Compare with forward slashes so a configured "src/" also matches Windows paths (src\...).
	const matchesIgnoredPart = relativeFolder.replaceAll('\\', '/').startsWith(ignorePathPart.replaceAll('\\', '/'));
	// The ExTester configuration file stores ignorePathPart without a trailing separator; drop the leftover one.
	const relativeLabel = matchesIgnoredPart ? relativeFolder.substring(ignorePathPart.length).replace(/^[/\\]/, '') : relativeFolder;
	return (vscode.workspace.workspaceFolders?.length ?? 0) > 1 ? `${owner?.name}/${relativeLabel}` : relativeLabel;
}
