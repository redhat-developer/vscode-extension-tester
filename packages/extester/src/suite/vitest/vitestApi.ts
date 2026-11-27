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

/**
 * The parts of Vitest's API that ExTester uses, typed here instead of imported from `vitest`.
 *
 * Vitest is an optional peer dependency resolved at runtime from the project under test, so
 * ExTester does not compile against its declarations: they pull in `@types/chai` 5, which clashes
 * with the `@types/chai` 4 used by Mocha test suites installed next to them (as in this monorepo).
 * Checked against Vitest 5; the unit tests run the adapter against the real package.
 */

/** Vitest's `vitest/node` module */
export interface VitestNodeModule {
	createVitest(options: VitestCliOptions, viteOverrides?: { plugins?: VitePlugin[] }): Promise<Vitest>;
}

/** Options accepted as if given on Vitest's command line */
export interface VitestCliOptions {
	run?: boolean;
	watch?: boolean;
	config?: string;
	testNamePattern?: string;
}

/** A Vite plugin that changes the configuration */
export interface VitePlugin {
	name: string;
	config?: (userConfig: { test?: VitestTestConfig }) => { test: VitestTestConfig };
}

/** The `test` section of a Vitest configuration, as far as ExTester sets or reads it */
export interface VitestTestConfig {
	setupFiles?: string[];
	fileParallelism?: boolean;
	maxWorkers?: number;
	testTimeout?: number;
	hookTimeout?: number;
	server?: { deps?: { external?: RegExp[] } };
}

export interface Vitest {
	readonly projects: VitestProject[];
	getRootProject(): VitestProject;
	standalone(): Promise<void>;
	runTestSpecifications(specifications: unknown[], allTestsRun?: boolean): Promise<VitestRunResult>;
	close(): Promise<void>;
}

export interface VitestProject {
	provide(key: string, value: unknown): void;
	createSpecification(moduleId: string): unknown;
}

export interface VitestRunResult {
	testModules: ReadonlyArray<{
		state(): string;
		children: { allTests(state?: 'failed'): Iterable<unknown> };
	}>;
	unhandledErrors: ReadonlyArray<unknown>;
}

/** Test context passed to Vitest's `beforeEach` */
export interface VitestTestContext {
	task: { name: string; fullTestName?: string };
	onTestFailed(handler: () => unknown): void;
}

/** Vitest's `vitest` module, as used by the worker setup file */
export interface VitestRuntimeModule {
	beforeEach(fn: (context: VitestTestContext) => unknown): void;
	inject(key: string): unknown;
}
