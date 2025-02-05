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
import { ShellExecution, TaskScope, workspace } from 'vscode';
import { TestRunner } from './TestRunnerTask';
import * as path from 'path';
import { Logger } from '../logger/logger';
import * as fs from 'fs';

/**
 * Task for running a single test file within the workspace.
 *
 * This task executes a specified test file by converting its TypeScript path to the
 * corresponding JavaScript file in the output folder. It retrieves necessary configurations
 * and constructs the appropriate command for execution using `extest`.
 */
export class RunFileTask extends TestRunner {
	/**
	 * Creates an instance of the `RunFileTask`.
	 *
	 * This constructor retrieves configurations, transforms the file path to match the
	 * compiled output location, and sets up the shell execution command.
	 *
	 * @param {string} file - The absolute path of the test file to be executed.
	 * @param {Logger} logger - The logger instance for logging messages.
	 */
	constructor(file: string, logger: Logger) {
		const workspaceFolder = workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceFolder) {
			logger.error('No workspace folder found.');
			vscode.window.showErrorMessage(`No workspace folder found.`);
			throw new Error('No workspace folder found.');
		}

		const configuration = workspace.getConfiguration('extesterRunner');

		// read tsconfig.json
		const tsconfigFile = configuration.get<string>('TSConfig') || 'tsconfig.json';
		const tsconfigPath = path.join(workspaceFolder, tsconfigFile);
		let outDirSettings = configuration.get<string>('outFolder');
		let rootDirSettings = configuration.get<string>('rootFolder');
		logger.debug('OutDir from settings: ' + outDirSettings);
		logger.debug('RootDir from settings: ' + rootDirSettings);

		let outDirJson;
		let rootDirJson;

		if (fs.existsSync(tsconfigPath)) {
			try {
				const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
				if (tsconfig.compilerOptions) {
					outDirJson = tsconfig.compilerOptions.outDir;
					rootDirJson = tsconfig.compilerOptions.rootDir;
				}
			} catch (error) {
				logger.error(`Error reading tsconfig.json: ${error}`);
			}
		} else {
			logger.debug('tsconfig.json not exists');
		}

		logger.debug('OutDir from tsconfig.json: ' + outDirJson);
		logger.debug('RootDir from tsconfig.json: ' + rootDirJson);

		// default values
		let outDir = 'out';
		let rootDir: string | undefined = undefined;

		// preference order: settings.json > tsconfig.json > default values
		outDir = outDirSettings?.length ? outDirSettings : outDirJson?.length ? outDirJson : outDir;
		rootDir = rootDirSettings?.length ? rootDirSettings : rootDirJson?.length ? rootDirJson : undefined; // can be undefined

		let relativePath = path.relative(workspaceFolder, file);
		let outputPath: string;
		if (rootDir) {
			const rootPath = path.join(workspaceFolder, rootDir);
			if (file.startsWith(rootPath)) {
				// preserve structure inside rootDir
				relativePath = path.relative(rootPath, file);
				outputPath = path.join(workspaceFolder, outDir, relativePath);
			} else {
				// file is outside rootDir (e.g., `it-tests/`)
				const fileName = path.basename(file);
				outputPath = path.join(workspaceFolder, outDir, fileName);
			}
		} else {
			// no rootDir defined - fallback to simple workspace-relative mapping
			outputPath = path.join(workspaceFolder, outDir, relativePath);
		}

		outputPath = outputPath.replace(/\.ts$/, '.js');

		logger.debug(`workspaceFolder: ${workspaceFolder}`);
		logger.debug(`outDir: ${outDir}`);
		logger.debug(`rootDir : ${rootDir || 'not set'}`);
		logger.debug(`file: ${file}`);
		logger.debug(`relativePath: ${relativePath}`);
		logger.debug(`resolved output path: ${outputPath}`);

		const visualStudioCodeVersion = configuration.get<string>('visualStudioCode.Version');
		const versionArgs = visualStudioCodeVersion ? ['--code_version', visualStudioCodeVersion] : [];
		const visualStudioCodeType = configuration.get<string>('visualStudioCode.Type');
		const typeArgs = visualStudioCodeType ? ['--type', visualStudioCodeType] : [];
		const additionalArgs = configuration.get<string[]>('additionalArgs', []) || [];
		const processedArgs = additionalArgs.flatMap((arg) => arg.match(/(?:[^\s"]+|"[^"]*")+/g) || []);

		const shellExecution = new ShellExecution('npx', ['extest', 'setup-and-run', `'${outputPath}'`, ...versionArgs, ...typeArgs, ...processedArgs]);

		const commandString = `npx extest setup-and-run '${outputPath}' ${versionArgs.join(' ')} ${typeArgs.join(' ')} ${additionalArgs.join(' ')}`;
		logger.info(`Running command: ${commandString}`);

		super(TaskScope.Workspace, 'Run Test File', shellExecution, logger);
	}
}
