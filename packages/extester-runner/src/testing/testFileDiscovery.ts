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
import { Logger } from '../logger/logger';
import { getRunnerConfiguration, shouldReportConfigurationError } from '../utils/projectConfiguration';

/**
 * Finds the test files of each workspace folder with its `testFileGlob` and `excludeGlob`.
 * The Testing view lists and runs the tests of these files.
 */
export class TestFileDiscovery {
	private readonly _onDidChange = new vscode.EventEmitter<void>();
	/** Fires when the list of test files may have changed. */
	readonly onDidChange: vscode.Event<void> = this._onDidChange.event;

	private refreshGeneration = 0;
	private files: vscode.Uri[] = [];

	private constructor(private readonly logger: Logger) {}

	/**
	 * Creates the discovery and finds the test files once.
	 *
	 * @param {Logger} logger - The logging utility.
	 * @returns {Promise<TestFileDiscovery>} The discovery, with the test files found.
	 */
	static async create(logger: Logger): Promise<TestFileDiscovery> {
		const discovery = new TestFileDiscovery(logger);
		await discovery.refresh();
		return discovery;
	}

	/**
	 * Finds the test files again. When refreshes overlap, the last one wins.
	 */
	async refresh(): Promise<void> {
		const generation = ++this.refreshGeneration;
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
			this._onDidChange.fire();
		}
	}

	/**
	 * The absolute paths of the test files found by the last refresh.
	 *
	 * @returns {string[]} The test files.
	 */
	getTestFiles(): string[] {
		return this.files.map((file) => file.fsPath);
	}

	dispose(): void {
		this._onDidChange.dispose();
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
