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

import { realpathSync, statSync } from 'node:fs';
import * as path from 'node:path';
import { loadConfigFile, type ExTesterConfig } from 'vscode-extension-tester/out/config';

/** Name of the ExTester configuration file that the CLI discovers and the Runner reads by default. */
export const PROJECT_CONFIG_FILE = 'extester.config.json';

export interface ConfigurationReader {
	get<T>(key: string, defaultValue?: T): T | undefined;
	/** Whether the effective value of `key` comes from the ExTester configuration file. */
	isFromConfigFile?(key: string): boolean;
}

/** Runner settings that are stored in the `runner` section of the ExTester configuration file. */
const runnerStringKeys = new Set(['rootFolder', 'outputFolder', 'ignorePathPart']);
const runnerGlobKeys = new Set(['testFileGlob', 'excludeGlob']);

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Forward-slash form of a path, used to compare a resolved glob with the workspace root. */
function toPosix(value: string): string {
	return value.split(path.sep).join('/');
}

/**
 * Express a path that the ExTester config loader resolved to an absolute path as a path relative
 * to the workspace root, because the Runner settings are relative to the workspace root.
 */
function toRootRelative(root: string, value: string, key: string): string {
	const relative = path.relative(root, value);
	if (relative.startsWith('..') || path.isAbsolute(relative)) {
		throw new Error(`"runner.${key}" must point inside the workspace folder.`);
	}
	return toPosix(relative);
}

/** Same as {@link toRootRelative} for a glob, whose syntax must be kept (the loader joins it with forward slashes). */
function toRootRelativeGlob(root: string, value: string, key: string): string {
	const prefix = `${toPosix(root)}/`;
	const comparable = process.platform === 'win32' ? (text: string) => text.toLowerCase() : (text: string) => text;
	if (!comparable(value).startsWith(comparable(prefix))) {
		throw new Error(`"runner.${key}" must point inside the workspace folder.`);
	}
	return value.slice(prefix.length);
}

function readRunnerSection(runner: unknown, root: string, result: Record<string, unknown>): void {
	if (runner === undefined) {
		return;
	}
	if (!isObject(runner)) {
		throw new Error('"runner" must be an object.');
	}
	for (const [key, value] of Object.entries(runner)) {
		result[key] = readRunnerValue(key, value, root);
	}
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isStringRecord(value: unknown): value is Record<string, string> {
	return isObject(value) && Object.values(value).every((item) => typeof item === 'string');
}

/** Convert one value of the `runner` section to the value of the Runner setting with the same name. */
function readRunnerValue(key: string, value: unknown, root: string): unknown {
	if (typeof value === 'string') {
		if (runnerStringKeys.has(key)) {
			return toRootRelative(root, value, key);
		}
		if (runnerGlobKeys.has(key)) {
			return toRootRelativeGlob(root, value, key);
		}
		if (key === 'preRunTask' || key === 'runCommand') {
			return value;
		}
	}
	const valid =
		(key === 'runSources' && typeof value === 'boolean') || (key === 'additionalArgs' && isStringArray(value)) || (key === 'env' && isStringRecord(value));
	if (!valid) {
		throw new Error(`Unknown setting or invalid value for "runner.${key}".`);
	}
	return value;
}

/**
 * Read the values that the `extest setup-and-run` command itself takes from the configuration file.
 * They are defined once, in `setup` / `run`, and the Runner uses them under its own setting names.
 */
function readSharedValues(config: ExTesterConfig, result: Record<string, unknown>): void {
	const setup = isObject(config.setup) ? config.setup : {};
	const run = isObject(config.run) ? config.run : {};
	const shared: [string, unknown][] = [
		['visualStudioCode.Version', setup.vscodeVersion ?? run.vscodeVersion],
		['visualStudioCode.Type', setup.type ?? run.type],
		['tempFolder', setup.storage ?? run.storage],
	];
	for (const [key, value] of shared) {
		if (typeof value === 'string') {
			result[key] = value;
		}
	}
}

/**
 * Locate the ExTester configuration file of a workspace root: `configFile` (relative to the root)
 * when it is set, otherwise `extester.config.json` in the root.
 * @returns the absolute path, or `undefined` when the default file does not exist
 */
export function findProjectConfigFile(root: string, configFile?: string): string | undefined {
	if (!configFile?.trim()) {
		const file = path.join(root, PROJECT_CONFIG_FILE);
		return statSync(file, { throwIfNoEntry: false })?.isFile() ? file : undefined;
	}
	const file = path.resolve(root, configFile);
	const relative = path.relative(root, file);
	if (relative.startsWith('..') || path.isAbsolute(relative)) {
		throw new Error(`The configFile ${file} must be inside the workspace folder ${root}.`);
	}
	return file;
}

/**
 * Read the Runner values from the ExTester configuration file of a workspace root, as
 * `extesterRunner` setting names. Invalid files must never silently fall back.
 * @param configFile the `extesterRunner.configFile` setting
 */
export function readProjectConfiguration(root: string, configFile?: string): Record<string, unknown> {
	const file = findProjectConfigFile(root, configFile);
	if (!file) {
		return {};
	}
	try {
		const config = loadConfigFile(file);
		if (!isObject(config)) {
			throw new Error('Expected a JSON object.');
		}
		const result: Record<string, unknown> = {};
		readSharedValues(config, result);
		readRunnerSection(config.runner, realpathSync(root), result);
		return result;
	} catch (error) {
		throw new Error(`Invalid ${file}: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/** The subset of `vscode.WorkspaceConfiguration.inspect()` needed to tell setting scopes apart. */
export interface SettingsInspector {
	inspect<T>(key: string): { defaultValue?: T; globalValue?: T; workspaceValue?: T; workspaceFolderValue?: T } | undefined;
}

/**
 * Merge project values with VS Code settings. Precedence, lowest to highest:
 * defaults < user (global) settings < ExTester configuration file < workspace / workspace-folder settings.
 * The configuration file is shared and beats personal global defaults; workspace settings are a local,
 * per-project override (typically an untracked `.vscode/settings.json`) and beat the configuration file.
 * Explicit project values count even when empty (`""`, `[]`, `false`).
 * @param onShadowed called when a workspace setting overrides a value present in the configuration file
 */
export function resolveConfiguration(project: Record<string, unknown>, settings: SettingsInspector, onShadowed?: (key: string) => void): ConfigurationReader {
	const localValue = <T>(key: string): T | undefined => {
		const scopes = settings.inspect<T>(key);
		return scopes?.workspaceFolderValue ?? scopes?.workspaceValue;
	};
	function get<T>(key: string, defaultValue?: T): T | undefined {
		const scopes = settings.inspect<T>(key);
		const local = localValue<T>(key);
		const inProject = Object.hasOwn(project, key);
		if (local !== undefined) {
			if (inProject) {
				onShadowed?.(key);
			}
			return local;
		}
		if (inProject) {
			return project[key] as T;
		}
		return scopes?.globalValue ?? scopes?.defaultValue ?? defaultValue;
	}
	function isFromConfigFile(key: string): boolean {
		return Object.hasOwn(project, key) && localValue(key) === undefined;
	}
	return { get, isFromConfigFile };
}
