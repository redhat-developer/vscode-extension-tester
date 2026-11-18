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

import { createRequire } from 'node:module';
import * as path from 'node:path';

/**
 * Find the first TypeScript input that no installed require hook can load.
 * Inputs covered by an existing hook (e.g. `NODE_OPTIONS="--require ts-node/register"` or
 * `--import tsx`) are skipped, so existing loader setups keep working without `tsx`.
 */
function findUnhandledTypeScript(files: Iterable<string>): string | undefined {
	return Array.from(files).find((file) => /\.(?:ts|tsx|cts)$/.test(file) && !require.extensions[path.extname(file)]);
}

/**
 * Resolve the consumer's `tsx` CommonJS API from the current working directory.
 * @throws an actionable error naming `source` when `tsx` is not installed
 */
function resolveTsx(source: string): { consumerRequire: NodeJS.Require; loader: string } {
	const project = process.cwd();
	const consumerRequire = createRequire(path.join(project, 'package.json'));
	try {
		return { consumerRequire, loader: consumerRequire.resolve('tsx/cjs/api') };
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND') {
			throw error;
		}
		throw new Error(
			`ExTester cannot load TypeScript file "${source}": the optional dependency "tsx" could not be resolved from "${project}".\n\n` +
				'Install it in the package containing your tests:\n' +
				'  npm install --save-dev tsx\n  yarn add --dev tsx\n  pnpm add --save-dev tsx\n\n' +
				'Then rerun ExTester. No Mocha loader configuration is required.',
		);
	}
}

/**
 * Check, without registering anything, that TypeScript inputs can be loaded. Lets
 * `setupAndRunTests` report a missing `tsx` before downloading VS Code and installing the extension.
 * @throws the same error {@link registerTypeScript} would throw for a missing `tsx`
 */
export function assertTypeScriptLoader(files: Iterable<string>): void {
	const source = findUnhandledTypeScript(files);
	if (source) {
		resolveTsx(source);
	}
}

/**
 * Register the consumer's optional loader before Mocha or custom locators load TypeScript.
 * Does nothing when no TypeScript input is present, or when a TypeScript require hook is
 * already installed (e.g. `NODE_OPTIONS="--require ts-node/register"` or `--import tsx`),
 * so existing loader setups keep working without `tsx`.
 * @returns a function that removes the registered loader, or `undefined` if none was registered
 */
export function registerTypeScript(files: Iterable<string>): (() => void) | undefined {
	const source = findUnhandledTypeScript(files);
	if (!source) {
		return undefined;
	}

	const { consumerRequire, loader } = resolveTsx(source);
	// Keep initialization outside the resolution catch: a broken loader must retain its actual error.
	const { register } = consumerRequire(loader) as typeof import('tsx/cjs/api');
	return register();
}
