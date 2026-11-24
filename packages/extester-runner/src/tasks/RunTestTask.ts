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
import { TestRunner } from './TestRunnerTask';
import { Logger } from '../logger/logger';
import { createTestExecution, getTaskConfiguration } from './taskConfiguration';
import { getFileTarget, getTestTargetSettings } from './testTarget';
import { buildGrepPattern } from '../utils/testGrep';

/**
 * Task for running one `describe` block or one `it` test of a test file.
 *
 * The file is run like with `RunFileTask`, and Mocha's `grep` option, passed to ExTester in the
 * `MOCHA_GREP` environment variable, selects the block by its full title.
 */
export class RunTestTask extends TestRunner {
	/**
	 * Creates an instance of the `RunTestTask`.
	 *
	 * @param {string} file - The absolute path of the test file that contains the block.
	 * @param {string[]} titles - The titles from the outermost `describe` block to the block to run.
	 * @param {boolean} isTest - Whether the block is an `it` test rather than a `describe` block.
	 * @param {Logger} logger - The logger instance for logging messages.
	 * @throws {Error} When no workspace folder is open or the configuration is invalid.
	 */
	constructor(file: string, titles: string[], isTest: boolean, logger: Logger) {
		const { owner, configuration, workspaceFolder } = getTaskConfiguration(vscode.Uri.file(file));

		const settings = getTestTargetSettings(configuration);
		const finalPath = getFileTarget(file, workspaceFolder, settings);
		const grep = buildGrepPattern(titles, isTest);
		logger.debug(`RunTestTask: Final path: ${finalPath}, grep: ${grep}`);

		const name = titles.at(-1) ?? '';
		super(
			owner,
			`Run ${isTest ? 'Test' : 'Suite'}: ${name}`,
			createTestExecution(owner, configuration, finalPath, logger, grep),
			logger,
			configuration.get<string>('preRunTask'),
		);
	}
}
