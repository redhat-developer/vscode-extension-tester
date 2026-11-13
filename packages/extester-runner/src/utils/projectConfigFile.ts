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

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ConfigurationReader {
	get<T>(key: string, defaultValue?: T): T | undefined;
}

const stringKeys = new Set(['$schema', 'testFileGlob', 'excludeGlob', 'ignorePathPart', 'rootFolder', 'outputFolder', 'tempFolder', 'configFile']);

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Read only the workspace root config. Invalid files must never silently fall back. */
export function readProjectConfiguration(root: string): Record<string, unknown> {
	const file = join(root, '.extester.json');
	let content: string;
	try {
		content = readFileSync(file, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return {};
		}
		throw new Error(`Cannot read ${file}: ${String(error)}`);
	}
	try {
		const parsed: unknown = JSON.parse(content);
		if (!isObject(parsed)) {
			throw new Error('Expected a JSON object.');
		}
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(parsed)) {
			if (key === 'visualStudioCode') {
				validateVersionSettings(value, result);
			} else if (isValidValue(key, value)) {
				result[key] = value;
			} else {
				throw new Error(`Unknown setting or invalid value for "${key}".`);
			}
		}
		return result;
	} catch (error) {
		throw new Error(`Invalid ${file}: ${error instanceof Error ? error.message : String(error)}`);
	}
}

function isValidValue(key: string, value: unknown): boolean {
	if (stringKeys.has(key)) {
		return typeof value === 'string' && (key !== 'configFile' || value.trim().length > 0);
	}
	if (key === 'hideEmptyLogFolders') {
		return typeof value === 'boolean';
	}
	return key === 'additionalArgs' && Array.isArray(value) && value.every((arg) => typeof arg === 'string');
}

function validateVersionSettings(value: unknown, result: Record<string, unknown>): void {
	if (!isObject(value)) {
		throw new Error('"visualStudioCode" must be an object.');
	}
	for (const [key, entry] of Object.entries(value)) {
		if ((key === 'Version' && typeof entry === 'string') || (key === 'Type' && (entry === 'stable' || entry === 'insider'))) {
			result[`visualStudioCode.${key}`] = entry;
		} else {
			throw new Error(`Unknown setting or invalid value for "visualStudioCode.${key}".`);
		}
	}
}

/** The subset of `vscode.WorkspaceConfiguration.inspect()` needed to tell setting scopes apart. */
export interface SettingsInspector {
	inspect<T>(key: string): { defaultValue?: T; globalValue?: T; workspaceValue?: T; workspaceFolderValue?: T } | undefined;
}

/**
 * Merge project values with VS Code settings. Precedence, lowest to highest:
 * defaults < user (global) settings < `.extester.json` < workspace / workspace-folder settings.
 * The project file is shared and beats personal global defaults; workspace settings are a local,
 * per-project override (typically an untracked `.vscode/settings.json`) and beat the project file.
 * Explicit project values count even when empty (`""`, `[]`, `false`).
 * @param onShadowed called when a workspace setting overrides a value present in the project file
 */
export function resolveConfiguration(project: Record<string, unknown>, settings: SettingsInspector, onShadowed?: (key: string) => void): ConfigurationReader {
	function get<T>(key: string, defaultValue?: T): T | undefined {
		const scopes = settings.inspect<T>(key);
		const local = scopes?.workspaceFolderValue ?? scopes?.workspaceValue;
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
	return { get };
}
