/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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
import { ConfigurationReader, readProjectConfiguration, resolveConfiguration } from './projectConfigFile';

const reportedShadows = new Set<string>();

/**
 * Resolve the runner configuration for the workspace root owning `resource` (default: first root).
 * See {@link resolveConfiguration} for the precedence between settings and `.extester.json`.
 */
export function getRunnerConfiguration(resource?: vscode.Uri): ConfigurationReader {
	const folder = resource ? vscode.workspace.getWorkspaceFolder(resource) : vscode.workspace.workspaceFolders?.[0];
	const project = folder ? readProjectConfiguration(folder.uri.fsPath) : {};
	return resolveConfiguration(project, vscode.workspace.getConfiguration('extesterRunner', folder?.uri ?? resource), (key) => {
		const id = `${folder?.uri.toString()}|${key}`;
		if (!reportedShadows.has(id)) {
			reportedShadows.add(id);
			void vscode.window.showInformationMessage(
				`ExTester Runner: the workspace setting "extesterRunner.${key}" overrides the value in .extester.json${folder ? ` of "${folder.name}"` : ''}. Remove it from the workspace settings to use the shared project value.`,
			);
		}
	});
}

/**
 * Configuration for display-only views (logs, screenshots). An invalid `.extester.json` is already
 * reported by test discovery and blocks test runs; here it must not break the views, so fall back
 * to the VS Code settings alone and log the problem.
 */
export function getDisplayConfiguration(onError: (message: string) => void): ConfigurationReader {
	try {
		return getRunnerConfiguration();
	} catch (error) {
		onError(`${error instanceof Error ? error.message : String(error)} Using VS Code settings for this view.`);
		return vscode.workspace.getConfiguration('extesterRunner', vscode.workspace.workspaceFolders?.[0]?.uri);
	}
}

/** Build the optional CLI config argument without changing the CLI's own configuration semantics. */
export function getConfigArguments(configuration: ConfigurationReader, root: string, additionalArgs: string[]): (string | vscode.ShellQuotedString)[] {
	const configFile = configuration.get<string>('configFile');
	if (!configFile) {
		return [];
	}
	if (additionalArgs.some((arg) => /^--config(?:=|$)/.test(arg.replace(/^['"]|['"]$/g, '')))) {
		throw new Error('Do not combine .extester.json configFile with --config in additionalArgs.');
	}
	return ['--config', { value: path.resolve(root, configFile), quoting: vscode.ShellQuoting.Strong }];
}
