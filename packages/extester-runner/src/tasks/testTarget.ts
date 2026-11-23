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

import * as path from 'node:path';

/**
 * Settings that decide which path a run command passes to `extest setup-and-run`.
 */
export interface TestTargetSettings {
	/** Pass the test sources as they are instead of the compiled JavaScript under `outputFolder`. */
	runSources: boolean;
	/** Folder with the compiled tests, relative to the workspace folder. Ignored when `runSources` is set. */
	outputFolder: string;
	/** Source folder whose leading segments are dropped when mapping to `outputFolder`. Ignored when `runSources` is set. */
	rootFolder?: string;
	/** Glob that discovers the test files; its last segment is the file pattern of folder and Run All runs. */
	testFileGlob: string;
}

/**
 * Read the {@link TestTargetSettings} from the `extesterRunner` configuration, with the defaults of `package.json`.
 */
export function getTestTargetSettings(configuration: { get<T>(key: string): T | undefined }): TestTargetSettings {
	return {
		runSources: configuration.get<boolean>('runSources') ?? false,
		outputFolder: configuration.get<string>('outputFolder') ?? 'out',
		rootFolder: configuration.get<string>('rootFolder'),
		testFileGlob: configuration.get<string>('testFileGlob') ?? '**/ui-test/**/*.test.ts',
	};
}

const SEPARATOR = /[/\\]/;

function segmentsOf(value: string): string[] {
	return value.split(SEPARATOR).filter(Boolean);
}

/**
 * File name pattern of folder and Run All runs: the last segment of `testFileGlob`,
 * with `.ts` mapped to `.js` unless the sources are run.
 */
function testFilePattern(settings: TestTargetSettings): string {
	const pattern = segmentsOf(settings.testFileGlob).pop() ?? '';
	return settings.runSources ? pattern : pattern.replace(/\.ts$/, '.js');
}

/**
 * Path in the compiled `outputFolder` that matches a path in the workspace. The leading
 * segments shared with `rootFolder` are dropped, as the compiled output does not contain them.
 */
function toOutput(target: string, workspaceFolder: string, settings: TestTargetSettings): string {
	const relativeSegments = segmentsOf(path.relative(workspaceFolder, target));
	const rootSegments = settings.rootFolder ? segmentsOf(settings.rootFolder) : [];
	const matchingSegmentsCount = rootSegments.reduce((count, segment, i) => (relativeSegments[i] === segment ? count + 1 : count), 0);
	return path.join(workspaceFolder, settings.outputFolder, ...relativeSegments.slice(matchingSegmentsCount));
}

/**
 * Path of a single test file to run.
 *
 * `<rootFolder>/tests/file.test.ts` runs as `<outputFolder>/tests/file.test.js`, or as is with `runSources`.
 */
export function getFileTarget(file: string, workspaceFolder: string, settings: TestTargetSettings): string {
	const filePath = path.resolve(file);
	return settings.runSources ? filePath : toOutput(filePath, workspaceFolder, settings).replace(/\.ts$/, '.js');
}

/**
 * Glob of the test files directly inside a folder.
 *
 * `<rootFolder>/tests` runs as `<outputFolder>/tests/*.test.js`, or as `<rootFolder>/tests/*.test.ts` with `runSources`.
 */
export function getFolderTarget(folder: string, workspaceFolder: string, settings: TestTargetSettings): string {
	const folderPath = path.resolve(folder);
	const base = settings.runSources ? folderPath : toOutput(folderPath, workspaceFolder, settings);
	return path.join(base, testFilePattern(settings));
}

/**
 * Glob of all test files, below the deepest folder that contains all of them.
 *
 * Files under `<rootFolder>/tests` run as `<outputFolder>/tests/**\/*.test.js`,
 * or as `<rootFolder>/tests/**\/*.test.ts` with `runSources`.
 */
export function getAllTarget(files: string[], workspaceFolder: string, settings: TestTargetSettings): string {
	const commonFolder = getCommonPath(files.map((file) => path.dirname(path.resolve(file)))) || workspaceFolder;
	const base = settings.runSources ? commonFolder : toOutput(commonFolder, workspaceFolder, settings);
	return path.join(base, '**', testFilePattern(settings));
}

/**
 * Returns the longest common directory path shared among all provided paths.
 *
 * This function splits each path on `/` or `\` and compares segments in order
 * to determine the shared prefix path. It stops at the first mismatch.
 *
 * @param paths - An array of paths to analyze.
 * @returns The common leading path shared among all input paths, or an empty string if there is none.
 */
export function getCommonPath(paths: string[]): string {
	if (!paths.length) {
		return '';
	}
	const splitPaths = paths.map((p) => p.split(SEPARATOR));
	const first = splitPaths[0];
	const common: string[] = [];
	for (let i = 0; i < first.length; i++) {
		if (splitPaths.every((sp) => sp[i] === first[i])) {
			common.push(first[i]);
		} else {
			break;
		}
	}
	// join back with the platform's own separator
	return common.join(path.sep);
}
