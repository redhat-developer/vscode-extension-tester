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
import { readFileSync, realpathSync, statSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * Setup section of `extester.config.json`.
 * Controls VS Code + ChromeDriver download and extension packaging/installation.
 */
export interface ExTesterSetupConfig {
	/** Version of VS Code to test against. Accepts `latest`, `min`, `max`, or a specific version string (e.g. `1.131.0`). Defaults to `latest`. */
	vscodeVersion?: string;
	/** Type of VS Code release. Defaults to `stable`. */
	type?: 'stable' | 'insider';
	/** Folder used for all test resources (VS Code binary, ChromeDriver, logs). Defaults to `$TEST_RESOURCES` or `$TMPDIR/test-resources`. */
	storage?: string;
	/** VS Code extensions directory override. */
	extensionsDir?: string;
	/** vsce packaging options forwarded directly to `vsce.createVSIX()`. */
	packageOptions?: IPackageOptions;
	/** Path to a custom VS Code `settings.json` file to apply before setup-phase CLI steps (e.g. proxy settings for marketplace installs). */
	settings?: string;
	/** Automatically install extensions your extension depends on from the marketplace. Defaults to `false`. */
	installDependencies?: boolean;
	/** Skip using a cached download and fetch a fresh copy. Defaults to `false`. */
	noCache?: boolean;
}

/**
 * Run section of `extester.config.json`.
 * Controls test execution inside VS Code.
 */
export interface ExTesterRunConfig {
	/** Glob pattern(s) for test files to run (e.g. `["./out/test/**\/*.test.js"]`). Used as CLI positional arguments when none are provided on the command line. */
	testFiles?: string[];
	/** Version of VS Code to test against. Accepts `latest`, `min`, `max`, or a specific version string. Defaults to `latest`. */
	vscodeVersion?: string;
	/** Type of VS Code release. Defaults to `stable`. */
	type?: 'stable' | 'insider';
	/** Folder used for all test resources. Defaults to `$TEST_RESOURCES` or `$TMPDIR/test-resources`. */
	storage?: string;
	/** VS Code extensions directory override. */
	extensionsDir?: string;
	/** Path to a custom VS Code `settings.json` file to use during the test run. */
	settings?: string;
	/** Path to a custom VS Code `keybindings.json` file (JSONC array) seeded into the test instance. */
	keybindings?: string;
	/** Path to a folder of snippet files seeded into the test instance's `User/snippets`. */
	snippets?: string;
	/** Uninstall the extension under test after the test run completes. Defaults to `false`. */
	cleanup?: boolean;
	/** Path to a Mocha configuration file (e.g. `.mocharc.js`). */
	mochaConfig?: string;
	/** Webdriver log level. Defaults to `Info`. */
	logLevel?: 'Debug' | 'Info' | 'Warning' | 'Severe' | 'OFF' | 'ALL';
	/** Run without an internet connection. All required resources must be pre-downloaded. Defaults to `false`. */
	offline?: boolean;
	/** Enable c8 code coverage collection. Defaults to `false`. */
	coverage?: boolean;
	/** File or folder paths to open in VS Code at startup. */
	resources?: string[];
	/** Path to a compiled JS locator contribution file for custom page objects. */
	customPageObjects?: string;
	/** Display language locale for VS Code (e.g. `ru`, `zh-cn`, `fr`). Requires the matching language pack extension to be installed. */
	locale?: string;
}

/**
 * Shape of `extester.config.json`.
 *
 * @example
 * ```json
 * {
 *   "$schema": "./node_modules/vscode-extension-tester/resources/extester.schema.json",
 *   "setup": { "vscodeVersion": "latest", "installDependencies": true },
 *   "run": { "testFiles": ["./out/test/**\/*.test.js"], "resources": ["."] }
 * }
 * ```
 */
export interface ExTesterConfig {
	/**
	 * Path(s) to base config file(s) to inherit from. Relative paths resolve against the
	 * directory of the config file that declares them. Later entries override earlier ones;
	 * this file overrides all bases. Objects are deep-merged; arrays and scalars are replaced
	 * whole. Never present in the loaded result.
	 */
	extends?: string | string[];
	/** Setup options: VS Code download, ChromeDriver, and extension installation. */
	setup?: ExTesterSetupConfig;
	/** Run options: test execution inside VS Code. */
	run?: ExTesterRunConfig;
}

/** Path-valued keys in ExTesterSetupConfig that must be resolved relative to the config file. */
const SETUP_PATH_KEYS: (keyof ExTesterSetupConfig)[] = ['storage', 'extensionsDir', 'settings'];

/** Path-valued keys in ExTesterRunConfig that must be resolved relative to the config file. */
const RUN_PATH_KEYS: (keyof ExTesterRunConfig)[] = ['storage', 'extensionsDir', 'settings', 'keybindings', 'snippets', 'mochaConfig', 'customPageObjects'];

/** Path-valued array keys in ExTesterRunConfig whose entries are plain paths (not glob patterns). */
const RUN_PATH_ARRAY_KEYS: (keyof ExTesterRunConfig)[] = ['resources'];

/**
 * Resolves a glob pattern relative to a base directory while preserving the glob syntax.
 *
 * `path.resolve` converts separators to the OS native style (backslashes on Windows),
 * which breaks glob engines that require forward slashes. Instead, this function resolves
 * only the non-glob prefix of the pattern and re-appends the glob suffix with forward
 * slashes, so patterns like `./out/**\/!(clipboard)*.test.js` work on all platforms.
 */
function resolveGlobPattern(baseDir: string, pattern: string): string {
	if (path.isAbsolute(pattern)) {
		// Already absolute — normalise separators to forward slashes and return as-is.
		return pattern.split(path.sep).join('/');
	}
	// Split at the last path separator before the first glob character so that the
	// directory boundary is preserved and re-attached with a forward slash.
	const globChars = /[*?{!(|@+[]/;
	const firstGlob = pattern.search(globChars);
	if (firstGlob === -1) {
		// No glob characters — treat as a plain path, but normalise separators.
		return path.resolve(baseDir, pattern).split(path.sep).join('/');
	}
	// Find the last separator before the first glob character to keep the full
	// directory part as the static prefix (e.g. './out/test/' not './out/test').
	const lastSepBeforeGlob = Math.max(pattern.lastIndexOf('/', firstGlob), pattern.lastIndexOf('\\', firstGlob));
	const staticPrefix = lastSepBeforeGlob >= 0 ? pattern.slice(0, lastSepBeforeGlob) : '';
	const globSuffix = lastSepBeforeGlob >= 0 ? pattern.slice(lastSepBeforeGlob + 1) : pattern;
	const resolvedPrefix = path.resolve(baseDir, staticPrefix);
	// Join with '/' regardless of OS so glob engines receive a valid glob string.
	return resolvedPrefix.split(path.sep).join('/') + '/' + globSuffix;
}

/**
 * Resolves all path-valued fields in a config object relative to the given base directory.
 * Only string values that are not already absolute are resolved.
 * Glob patterns (testFiles) are resolved via resolveGlobPattern to preserve glob syntax.
 */
function resolvePaths(config: ExTesterConfig, baseDir: string): ExTesterConfig {
	if (config.setup) {
		const setup = { ...config.setup };
		for (const key of SETUP_PATH_KEYS) {
			const val = setup[key];
			if (typeof val === 'string' && !path.isAbsolute(val)) {
				(setup as Record<string, unknown>)[key] = path.resolve(baseDir, val);
			}
		}
		config = { ...config, setup };
	}

	if (config.run) {
		const run = { ...config.run };
		for (const key of RUN_PATH_KEYS) {
			const val = run[key];
			if (typeof val === 'string' && !path.isAbsolute(val)) {
				(run as Record<string, unknown>)[key] = path.resolve(baseDir, val);
			}
		}
		// Plain path arrays (e.g. resources) — resolve with path.resolve.
		for (const key of RUN_PATH_ARRAY_KEYS) {
			const arr = run[key];
			if (Array.isArray(arr)) {
				(run as Record<string, unknown>)[key] = arr.map((v: string) => (typeof v === 'string' && !path.isAbsolute(v) ? path.resolve(baseDir, v) : v));
			}
		}
		// Glob patterns — resolve preserving forward slashes and glob syntax.
		if (Array.isArray(run.testFiles)) {
			run.testFiles = run.testFiles.map((v: string) => (typeof v === 'string' ? resolveGlobPattern(baseDir, v) : v));
		}
		config = { ...config, run };
	}

	return config;
}

/** Returns true for plain (non-array) objects — the only values that are deep-merged. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-merges `override` into `base` and returns a new object.
 * Plain objects merge recursively; arrays and scalars in `override` replace the base value whole.
 * `__proto__`/`constructor`/`prototype` keys are skipped to prevent prototype pollution.
 */
function mergeConfigs(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = { ...base };
	for (const key of Object.keys(override)) {
		if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
			continue;
		}
		const baseVal = result[key];
		const overrideVal = override[key];
		result[key] = isPlainObject(baseVal) && isPlainObject(overrideVal) ? mergeConfigs(baseVal, overrideVal) : overrideVal;
	}
	return result;
}

/**
 * Reads and parses a single config file. Error messages name this specific file, so with
 * `extends` chains the failing file (base or child) is always identifiable.
 */
function readConfigFile(filePath: string): ExTesterConfig {
	try {
		const stat = statSync(filePath);
		if (!stat.isFile()) {
			throw new Error(`extester config: path is not a file: ${filePath}`);
		}
	} catch (err: unknown) {
		if (err instanceof Error && err.message.startsWith('extester config:')) {
			throw err;
		}
		throw new Error(`extester config: file not found: ${filePath}`);
	}

	let raw: string;
	try {
		raw = readFileSync(filePath, 'utf8');
	} catch {
		throw new Error(`extester config: could not read file: ${filePath}`);
	}

	try {
		return JSON.parse(raw) as ExTesterConfig;
	} catch {
		throw new Error(`extester config: invalid JSON in ${filePath}`);
	}
}

/**
 * Resolves an `extends` target declared inside a config file to a canonical path.
 *
 * Unlike {@link safeConfigPath} (which gates CLI-provided `--config` input per SonarCloud
 * rule tssecurity:S8707), extends targets are NOT restricted to cwd/tmpdir: the specifier
 * comes from a config file the user already owns and explicitly loaded, not from untrusted
 * process input, and the primary use case is a shared base config ABOVE the package
 * directory (e.g. a monorepo root). The path is still canonicalised via realpathSync and
 * must have a .json extension.
 */
function safeExtendsPath(specifier: string, declaringDir: string): string {
	const resolved = path.isAbsolute(specifier) ? specifier : path.resolve(declaringDir, specifier);
	let canonical: string;
	try {
		canonical = realpathSync(resolved);
	} catch {
		throw new Error(`extester config: extended config file not found: ${resolved}`);
	}
	if (path.extname(canonical).toLowerCase() !== '.json') {
		throw new Error(`extester config: extended config file must be a .json file: ${canonical}`);
	}
	return canonical;
}

/**
 * Loads a config file and recursively merges in its `extends` bases.
 *
 * Each file's relative paths are resolved against its own directory BEFORE merging, so
 * paths declared in a base config stay anchored to the base file's location. Bases are
 * merged in declaration order (later ones win) and the extending file is merged last.
 *
 * @param canonicalPath Canonical (realpath'd) path of the config file to load.
 * @param visited Chain of canonical paths currently being loaded, for cycle detection.
 */
function loadConfigWithExtends(canonicalPath: string, visited: string[]): ExTesterConfig {
	if (visited.includes(canonicalPath)) {
		throw new Error(`extester config: circular extends detected: ${[...visited, canonicalPath].join(' -> ')}`);
	}
	const parsed = readConfigFile(canonicalPath);
	const dir = path.dirname(canonicalPath);

	// Consume `extends` before path resolution and merging so it never appears in the result.
	const extendsValue = parsed.extends;
	delete parsed.extends;
	const specifiers = typeof extendsValue === 'string' ? [extendsValue] : (extendsValue ?? []);
	if (!Array.isArray(specifiers) || specifiers.some((spec) => typeof spec !== 'string')) {
		throw new Error(`extester config: "extends" must be a string or an array of strings in ${canonicalPath}`);
	}

	const self = resolvePaths(parsed, dir);
	const chain = [...visited, canonicalPath];
	let merged: Record<string, unknown> = {};
	for (const spec of specifiers) {
		// Earlier bases are merged first, so later entries override earlier ones.
		const base = loadConfigWithExtends(safeExtendsPath(spec, dir), chain);
		merged = mergeConfigs(merged, base as Record<string, unknown>);
	}
	return mergeConfigs(merged, self as Record<string, unknown>) as ExTesterConfig;
}

/**
 * Resolves a config file path from CLI input to a safe canonical path.
 *
 * Follows the exact order prescribed by SonarCloud rule tssecurity:S8707:
 *   1. realpathSync(input)         — canonicalise (resolves .., symlinks)
 *   2. realpathSync(allowedRoot)   — canonicalise the boundary too
 *   3. startsWith(boundary + sep)  — validate the canonicalised result
 *   4. return the validated path   — only this value reaches file-read callers
 *
 * Allowed roots: process.cwd() and os.tmpdir().
 * Also enforces that the file has a .json extension.
 */
function safeConfigPath(filePath: string): string {
	let resolved: string;
	try {
		resolved = realpathSync(filePath);
	} catch {
		throw new Error(`extester config: file not found: ${filePath}`);
	}

	if (path.extname(resolved).toLowerCase() !== '.json') {
		throw new Error(`extester config: config file must be a .json file: ${resolved}`);
	}

	const allowedRoots = [process.cwd(), os.tmpdir()].map((r) => {
		try {
			return realpathSync(r) + path.sep;
		} catch {
			return path.resolve(r) + path.sep;
		}
	});

	const isAllowed = allowedRoots.some((root) => resolved === root.slice(0, -1) || resolved.startsWith(root));
	if (!isAllowed) {
		throw new Error(`extester config: config file must be within the project directory or temp directory: ${resolved}`);
	}

	return resolved;
}

/**
 * Loads and parses an `extester.config.json` configuration file.
 *
 * - If `configPath` is provided, that exact file is read (throws if it does not exist).
 * - If `configPath` is omitted, `find-up` walks from `process.cwd()` looking for
 *   `extester.config.json`. Returns `{}` when no file is found.
 * - A top-level `extends` field (string or array of file paths) pulls in base config
 *   file(s), which are deep-merged underneath this file's own values. See
 *   {@link loadConfigWithExtends} for the merge rules.
 * - All relative paths inside each config file are resolved relative to the directory
 *   containing that file, so paths work regardless of where `extest` is invoked from.
 *
 * @param configPath Optional explicit path to the config file.
 * @returns Parsed, merged and path-resolved {@link ExTesterConfig}. Empty object when no file is found.
 */
export async function loadConfig(configPath?: string): Promise<ExTesterConfig> {
	let safePath: string | undefined;

	if (configPath) {
		// CLI-provided path: run through safeConfigPath immediately.
		safePath = safeConfigPath(configPath);
	} else {
		// Auto-discovered path: find-up returns an absolute path; still validate it.
		const { findUp } = await import('find-up');
		const found = await findUp('extester.config.json');
		if (found) {
			safePath = safeConfigPath(found);
		}
	}

	if (!safePath) {
		return {};
	}

	return loadConfigWithExtends(safePath, []);
}
