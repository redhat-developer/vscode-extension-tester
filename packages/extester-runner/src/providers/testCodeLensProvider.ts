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
import { Logger } from '../logger/logger';
import { TestBlock, TestRunTarget } from '../types/testTypes';
import { parseTestFile } from '../utils/parser';

/**
 * Lists the `describe` blocks and `it` tests of a parsed test file that can be run on their own.
 *
 * @param {TestBlock[]} blocks - The parsed `describe` blocks.
 * @param {string[]} [parentTitles] - The titles of the `describe` blocks that contain the blocks.
 * @returns {TestRunTarget[]} The run targets, each block before its tests and nested blocks.
 */
export function listRunTargets(blocks: TestBlock[], parentTitles: string[] = []): TestRunTarget[] {
	return blocks.flatMap((block) => {
		const titles = [...parentTitles, block.describe];
		return [
			{ file: block.filePath, titles, isTest: false, line: block.line },
			...block.its.map((it) => ({ file: it.filePath, titles: [...titles, it.name], isTest: true, line: it.line })),
			...listRunTargets(block.children, titles),
		];
	});
}

/**
 * Shows a **Run** CodeLens above each `describe` block and `it` test of a discovered test file.
 */
export class TestCodeLensProvider implements vscode.CodeLensProvider {
	private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
	readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

	/**
	 * Creates an instance of the `TestCodeLensProvider`.
	 *
	 * @param {(filePath: string) => boolean} isTestFile - Whether a file is one of the discovered test files.
	 * @param {Logger} logger - The logger instance for logging messages.
	 */
	constructor(
		private readonly isTestFile: (filePath: string) => boolean,
		private readonly logger: Logger,
	) {}

	/**
	 * Asks VS Code to request the CodeLenses again, for example after test discovery or a setting changed.
	 */
	refresh(): void {
		this._onDidChangeCodeLenses.fire();
	}

	async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
		if (document.uri.scheme !== 'file' || !this.isTestFile(document.uri.fsPath)) {
			return [];
		}
		if (!vscode.workspace.getConfiguration('extesterRunner', document.uri).get<boolean>('codeLens', true)) {
			return [];
		}
		try {
			const blocks = await parseTestFile(document.uri, this.logger);
			return listRunTargets(blocks).map((target) => {
				const range = new vscode.Range(target.line - 1, 0, target.line - 1, 0);
				return new vscode.CodeLens(range, {
					title: '$(play) Run',
					tooltip: target.isTest ? 'Run this test' : 'Run this describe block',
					command: 'extester-runner.runTest',
					arguments: [target],
				});
			});
		} catch (error) {
			// The file cannot be parsed while it is being edited; the lenses come back once it can.
			this.logger.debug(`No CodeLenses for ${document.uri.fsPath}: ${error}`);
			return [];
		}
	}

	dispose(): void {
		this._onDidChangeCodeLenses.dispose();
	}
}
