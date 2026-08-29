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

import type { IPackageOptions } from '@vscode/vsce';
import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Compile-time-complete list of `IPackageOptions` keys from `@vscode/vsce`.
 * The `Record<keyof ...>` type forces this object to name every field exactly once,
 * so a vsce upgrade that adds or removes fields fails compilation here — update
 * this list and `resources/extester.schema.json` together.
 */
const PACKAGE_OPTIONS_KEYS: Record<keyof Required<IPackageOptions>, true> = {
	packagePath: true,
	version: true,
	target: true,
	ignoreOtherTargetFolders: true,
	followSymlinks: true,
	commitMessage: true,
	gitTagVersion: true,
	updatePackageJson: true,
	cwd: true,
	readmePath: true,
	changelogPath: true,
	githubBranch: true,
	gitlabBranch: true,
	rewriteRelativeLinks: true,
	baseContentUrl: true,
	baseImagesUrl: true,
	useYarn: true,
	dependencyEntryPoints: true,
	ignoreFile: true,
	gitHubIssueLinking: true,
	gitLabIssueLinking: true,
	dependencies: true,
	preRelease: true,
	allowStarActivation: true,
	allowMissingRepository: true,
	allowUnusedFilesPattern: true,
	allowPackageSecrets: true,
	allowPackageAllSecrets: true,
	allowPackageEnvFile: true,
	skipLicense: true,
	signTool: true,
};

describe('extester.schema.json', () => {
	// out/test → out → package root → resources
	const schemaPath = path.resolve(__dirname, '..', '..', 'resources', 'extester.schema.json');
	const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
	const schemaPackageOptions: Record<string, unknown> = schema.properties.setup.properties.packageOptions.properties;

	it('documents every IPackageOptions field of @vscode/vsce in setup.packageOptions', () => {
		const missing = Object.keys(PACKAGE_OPTIONS_KEYS).filter((key) => !(key in schemaPackageOptions));
		assert.deepStrictEqual(missing, [], `schema is missing packageOptions fields: ${missing.join(', ')}`);
	});

	it('documents only fields that exist on IPackageOptions in setup.packageOptions', () => {
		const unknown = Object.keys(schemaPackageOptions).filter((key) => !(key in PACKAGE_OPTIONS_KEYS));
		assert.deepStrictEqual(unknown, [], `schema documents unknown packageOptions fields: ${unknown.join(', ')}`);
	});

	it('keeps packageOptions open for future vsce fields (additionalProperties: true)', () => {
		assert.strictEqual(schema.properties.setup.properties.packageOptions.additionalProperties, true);
	});
});
