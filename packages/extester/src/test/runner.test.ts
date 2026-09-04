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
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { VSRunner } from '../suite/runner';
import { ReleaseQuality } from '../util/codeUtil';

/**
 * Writes a mocha YAML config with the given content into a fresh temp dir and returns its path.
 */
function writeMocharc(content: string, name = '.mocharc.yml'): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'extester-runner-test-'));
	const file = path.join(dir, name);
	fs.writeFileSync(file, content, 'utf8');
	return file;
}

/**
 * Loads a mocha config file through VSRunner's private loader so the assertions target exactly
 * what `new Mocha(...)` receives.
 */
function loadMochaConfig(file: string): Mocha.MochaOptions {
	const runner = new VSRunner('/dev/null', '1.100.0', ReleaseQuality.Stable);
	return runner['loadConfig'](file);
}

describe('VSRunner mocha config loading (YAML)', () => {
	const tmpDirs: string[] = [];

	afterEach(() => {
		for (const dir of tmpDirs.splice(0)) {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});

	function mocharc(content: string, name?: string): string {
		const file = writeMocharc(content, name);
		tmpDirs.push(path.dirname(file));
		return file;
	}

	it('parses common mocha options from .mocharc.yml', () => {
		const file = mocharc(['timeout: 5000', 'require: ts-node/register', 'spec:', '  - out/**/*.js', 'bail: true', 'slow: 75', 'retries: 2', ''].join('\n'));
		const conf = loadMochaConfig(file);
		assert.deepStrictEqual(conf, {
			timeout: 5000,
			require: 'ts-node/register',
			spec: ['out/**/*.js'],
			bail: true,
			slow: 75,
			retries: 2,
		});
	});

	it('accepts the .yaml extension too', () => {
		const file = mocharc('timeout: 1234\n', '.mocharc.yaml');
		assert.deepStrictEqual(loadMochaConfig(file), { timeout: 1234 });
	});

	it('keeps YAML 1.2 scalar semantics (yes/on stay strings, like mocha itself)', () => {
		const file = mocharc('bail: yes\ncolor: on\nparallel: true\n');
		assert.deepStrictEqual(loadMochaConfig(file), { bail: 'yes', color: 'on', parallel: true });
	});

	it('honours YAML merge keys (<<) the same way mocha does', () => {
		const file = mocharc(['defaults: &defaults', '  timeout: 3000', '  retries: 1', '<<: *defaults', 'bail: true', ''].join('\n'));
		const conf = loadMochaConfig(file);
		assert.deepStrictEqual(conf, { defaults: { timeout: 3000, retries: 1 }, timeout: 3000, retries: 1, bail: true });
		assert.ok(!('<<' in conf), 'merge key must be applied, not kept as a literal "<<" key');
	});

	it('treats an empty config file as "no options" instead of failing', () => {
		const file = mocharc('');
		assert.deepStrictEqual(loadMochaConfig(file), {});
	});

	it('treats a comment-only config file as "no options" instead of failing', () => {
		const file = mocharc('# mocha options go here\n');
		assert.deepStrictEqual(loadMochaConfig(file), {});
	});

	it('rejects a multi-document YAML config when the config was passed explicitly', () => {
		const file = mocharc('timeout: 1000\n---\ntimeout: 2000\n');
		assert.throws(() => loadMochaConfig(file), /Failed to parse mocha configuration/);
	});

	it('still rejects malformed YAML when the config was passed explicitly', () => {
		const file = mocharc('timeout: [unclosed\n');
		assert.throws(() => loadMochaConfig(file), /Failed to parse mocha configuration/);
	});
});
