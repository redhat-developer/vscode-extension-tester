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
 * Task for running all test files within a specified folder.
 *
 * This task executes all test files located within a given folder by converting the
 * folder path to match the compiled output structure. It retrieves necessary configurations
 * and constructs the appropriate command for execution using `extest`.
 */
export class RunFolderTask extends TestRunner {
	/**
	 * Creates an instance of the `RunFolderTask`.
	 *
	 * This constructor retrieves configurations, transforms the folder path to match the
	 * compiled output structure, and sets up the shell execution command.
	 *
	 * @param {string} folder - The absolute path of the folder containing test files.
	 * @param {Logger} logger - The logger instance for logging messages.
	 */
	constructor(folder: string, logger: Logger) {
		const configuration = workspace.getConfiguration('extesterRunner');
		const workspaceFolder = workspace.workspaceFolders?.[0]?.uri.fsPath;

		if (!workspaceFolder) {
			logger.error('No workspace folder found.');
			vscode.window.showErrorMessage(`No workspace folder found.`);
			throw new Error('No workspace folder found.');
		}

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

		let relativePath = path.relative(workspaceFolder, folder);
		let outputPath: string;

		if (rootDir) {
			const rootPath = path.join(workspaceFolder, rootDir);
			if (folder.startsWith(rootPath)) {
				// preserve structure inside rootDir
				relativePath = path.relative(rootPath, folder);
				outputPath = path.join(workspaceFolder, outDir, relativePath);
			} else {
				// folder is outside rootDir (e.g., `it-tests/`)
				const folderName = path.basename(folder);
				outputPath = path.join(workspaceFolder, outDir, folderName);
			}
		} else {
			// no rootDir defined - fallback to simple workspace-relative mapping
			outputPath = path.join(workspaceFolder, outDir, relativePath);
		}

		const testFileGlob = configuration.get<string>('testFileGlob') || '**/ui-test/**/*.test.ts';
		const outputFilePattern = (testFileGlob?.split('/').pop() || testFileGlob).replace(/\.ts$/, '.js');
		const fullOutputPath = path.join(outputPath, outputFilePattern);

		logger.debug(`workspaceFolder: ${workspaceFolder}`);
		logger.debug(`outDir: ${outDir}`);
		logger.debug(`rootDir: ${rootDir || 'not set'}`);
		logger.debug(`folder: ${folder}`);
		logger.debug(`relativePath: ${relativePath}`);
		logger.debug(`resolved output path: ${fullOutputPath}`);

		const visualStudioCodeVersion = configuration.get<string>('visualStudioCode.Version');
		const versionArgs = visualStudioCodeVersion ? ['--code_version', visualStudioCodeVersion] : [];
		const visualStudioCodeType = configuration.get<string>('visualStudioCode.Type');
		const typeArgs = visualStudioCodeType ? ['--type', visualStudioCodeType] : [];
		const additionalArgs = configuration.get<string[]>('additionalArgs', []) || [];
		const processedArgs = additionalArgs.flatMap((arg) => arg.match(/(?:[^\s"]+|"[^"]*")+/g) || []);

		logger.info(`Resolved output path: ${fullOutputPath}`);

		const shellExecution = new ShellExecution('npx', ['extest', 'setup-and-run', `'${fullOutputPath}'`, ...versionArgs, ...typeArgs, ...processedArgs]);

		const commandString = `npx extest setup-and-run '${fullOutputPath}' ${versionArgs.join(' ')} ${typeArgs.join(' ')} ${additionalArgs.join(' ')}`;
		logger.info(`Running command: ${commandString}`);

		super(TaskScope.Workspace, 'Run Test Folder', shellExecution, logger);
	}
}
