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
import { ConfigurationReader, PROJECT_CONFIG_FILE, readProjectConfiguration, resolveConfiguration } from './projectConfigFile';

interface CacheEntry {
	project?: Record<string, unknown>;
	error?: Error;
	/** Channels (e.g. 'discovery', 'views') that already reported `error`. */
	reported: Set<string>;
}

/** Parsed configuration file per workspace root, cleared when the file or the settings change. */
const cache = new Map<string, CacheEntry>();
const reportedShadows = new Set<string>();

/** Forget the parsed configuration files, so the next read picks up edits. */
export function clearProjectConfigurationCache(): void {
	cache.clear();
}

function ownerOf(resource?: vscode.Uri): vscode.WorkspaceFolder | undefined {
	return resource ? vscode.workspace.getWorkspaceFolder(resource) : vscode.workspace.workspaceFolders?.[0];
}

/** The `extesterRunner.configFile` setting of a workspace root. */
export function getConfigFileSetting(folder: vscode.WorkspaceFolder): string | undefined {
	return vscode.workspace.getConfiguration('extesterRunner', folder.uri).get<string>('configFile')?.trim() || undefined;
}

/** Glob, relative to the workspace root, of the configuration file that the Runner reads for this root. */
export function getProjectConfigPattern(folder: vscode.WorkspaceFolder): string {
	return (getConfigFileSetting(folder) ?? PROJECT_CONFIG_FILE).replaceAll('\\', '/');
}

function loadEntry(folder: vscode.WorkspaceFolder): CacheEntry {
	const key = folder.uri.toString();
	let entry = cache.get(key);
	if (!entry) {
		entry = { reported: new Set() };
		try {
			entry.project = readProjectConfiguration(folder.uri.fsPath, getConfigFileSetting(folder));
		} catch (error) {
			entry.error = error instanceof Error ? error : new Error(String(error));
		}
		cache.set(key, entry);
	}
	return entry;
}

/** The error of an invalid configuration file of the root owning `resource`, if any. */
export function getProjectConfigurationError(resource?: vscode.Uri): Error | undefined {
	const folder = ownerOf(resource);
	return folder ? loadEntry(folder).error : undefined;
}

/**
 * Whether the configuration error of the root owning `resource` still has to be reported on `channel`.
 * Each error is reported once per channel until the file changes, instead of on every refresh.
 */
export function shouldReportConfigurationError(resource: vscode.Uri | undefined, channel: string): boolean {
	const folder = ownerOf(resource);
	if (!folder) {
		return true;
	}
	const entry = loadEntry(folder);
	if (entry.reported.has(channel)) {
		return false;
	}
	entry.reported.add(channel);
	return true;
}

/**
 * Resolve the runner configuration for the workspace root owning `resource` (default: first root).
 * See {@link resolveConfiguration} for the precedence between settings and the ExTester configuration file.
 * @throws when the configuration file of that root is invalid
 */
export function getRunnerConfiguration(resource?: vscode.Uri): ConfigurationReader {
	const folder = ownerOf(resource);
	let project: Record<string, unknown> = {};
	if (folder) {
		const entry = loadEntry(folder);
		if (entry.error) {
			throw entry.error;
		}
		project = entry.project ?? {};
	}
	return resolveConfiguration(project, vscode.workspace.getConfiguration('extesterRunner', folder?.uri ?? resource), (key) => {
		const id = `${folder?.uri.toString()}|${key}`;
		if (!reportedShadows.has(id)) {
			reportedShadows.add(id);
			const owner = folder ? ` of "${folder.name}"` : '';
			void vscode.window.showInformationMessage(
				`ExTester Runner: the workspace setting "extesterRunner.${key}" overrides the value in the ExTester configuration file${owner}. Remove it from the workspace settings to use the shared project value.`,
			);
		}
	});
}

/**
 * Configuration for display-only views (logs, screenshots). An invalid configuration file is already
 * reported by test discovery and blocks test runs; here it must not break the views, so fall back
 * to the VS Code settings alone and log the problem once.
 */
export function getDisplayConfiguration(onError: (message: string) => void): ConfigurationReader {
	try {
		return getRunnerConfiguration();
	} catch (error) {
		if (shouldReportConfigurationError(undefined, 'views')) {
			onError(`${error instanceof Error ? error.message : String(error)} Using VS Code settings for this view.`);
		}
		return vscode.workspace.getConfiguration('extesterRunner', vscode.workspace.workspaceFolders?.[0]?.uri);
	}
}

/**
 * Build the optional CLI config argument. The CLI finds `extester.config.json` in the workspace root on
 * its own, so `--config` is passed only when `extesterRunner.configFile` points to another file.
 */
export function getConfigArguments(folder: vscode.WorkspaceFolder, additionalArgs: string[]): (string | vscode.ShellQuotedString)[] {
	const configFile = getConfigFileSetting(folder);
	if (!configFile) {
		return [];
	}
	if (additionalArgs.some((arg) => /^--config(?:=|$)/.test(arg.replaceAll(/^['"]|['"]$/g, '')))) {
		throw new Error('Do not combine extesterRunner.configFile with --config in additionalArgs.');
	}
	return ['--config', { value: path.resolve(folder.uri.fsPath, configFile), quoting: vscode.ShellQuoting.Strong }];
}
