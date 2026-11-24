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

import { strict as assert } from 'node:assert';
import { buildRunCommand, TARGET_PLACEHOLDER } from '../../utils/runCommand';

describe('Custom run command', () => {
	const target = '/work/project/out/ui-test/*.test.js';

	it('replaces each target placeholder with the quoted target', () => {
		const command = `npx extest run-tests ${TARGET_PLACEHOLDER} --mocha_config ${TARGET_PLACEHOLDER}.mocharc`;
		assert.equal(buildRunCommand(command, target), `npx extest run-tests '${target}' --mocha_config '${target}'.mocharc`);
	});

	it('appends the quoted target when the command has no placeholder', () => {
		assert.equal(buildRunCommand('  npm run ui-test --  ', target), `npm run ui-test -- '${target}'`);
	});
});
