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

import assert from 'assert';
import * as vsce from '@vscode/vsce';
import type { IPackageOptions } from '@vscode/vsce';
import { CodeUtil } from '../util/codeUtil';
import { ReleaseQuality } from '../util/codeUtil';

describe('CodeUtil.packageExtension', () => {
	let originalCreateVSIX: typeof vsce.createVSIX;
	let capturedOptions: IPackageOptions | undefined;

	beforeEach(() => {
		// Stub vsce.createVSIX to capture whatever is passed in
		originalCreateVSIX = vsce.createVSIX;
		capturedOptions = undefined;
		(vsce as { createVSIX: unknown }).createVSIX = async (opts: IPackageOptions) => {
			capturedOptions = opts;
		};
	});

	afterEach(() => {
		// Restore original
		(vsce as { createVSIX: unknown }).createVSIX = originalCreateVSIX;
	});

	function makeCodeUtil(): CodeUtil {
		// Use a temp path; no disk access is needed for these tests
		return new CodeUtil('/tmp/test-resources', ReleaseQuality.Stable);
	}

	it('calls createVSIX with an empty object when no options are provided', async () => {
		const util = makeCodeUtil();
		await util.packageExtension(undefined);
		assert.deepStrictEqual(capturedOptions, {});
	});

	it('forwards useYarn to createVSIX', async () => {
		const util = makeCodeUtil();
		await util.packageExtension({ useYarn: true });
		assert.deepStrictEqual(capturedOptions, { useYarn: true });
	});

	it('forwards followSymlinks to createVSIX', async () => {
		const util = makeCodeUtil();
		await util.packageExtension({ followSymlinks: true });
		assert.deepStrictEqual(capturedOptions, { followSymlinks: true });
	});

	it('forwards a combination of options to createVSIX', async () => {
		const options: IPackageOptions = { useYarn: true, followSymlinks: true, preRelease: true };
		const util = makeCodeUtil();
		await util.packageExtension(options);
		assert.deepStrictEqual(capturedOptions, options);
	});

	it('does not mutate the options object passed in', async () => {
		const options: IPackageOptions = { useYarn: true };
		const frozen = Object.freeze(options);
		const util = makeCodeUtil();
		await util.packageExtension(frozen);
		assert.deepStrictEqual(capturedOptions, { useYarn: true });
	});
});
