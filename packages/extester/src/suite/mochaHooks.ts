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
/* eslint-disable no-redeclare */
import { Func } from 'mocha';
import { VSBrowser } from '../extester';
import sanitize from 'sanitize-filename';

type HookType = 'before' | 'beforeEach' | 'after' | 'afterEach';

/**
 * The names of Mocha's function for each kind of hook: the BDD (and QUnit) name, then the TDD name.
 * Mocha defines the functions of the interface that its `ui` option selects.
 */
const mochaHookNames: Record<HookType, readonly [bdd: string, tdd: string]> = {
	before: ['before', 'suiteSetup'],
	beforeEach: ['beforeEach', 'setup'],
	after: ['after', 'suiteTeardown'],
	afterEach: ['afterEach', 'teardown'],
};

function vscodeBefore(fn: Function): void;
function vscodeBefore(name: string, fn: Function): void;
function vscodeBefore(name?: any, fn?: any): void {
	callHook('before', name, fn);
}

function vscodeBeforeEach(fn: Function): void;
function vscodeBeforeEach(name: string, fn: Function): void;
function vscodeBeforeEach(name?: any, fn?: any): void {
	callHook('beforeEach', name, fn);
}

function vscodeAfter(fn: Function): void;
function vscodeAfter(name: string, fn: Function): void;
function vscodeAfter(name?: any, fn?: any): void {
	callHook('after', name, fn);
}

function vscodeAfterEach(fn: Function): void;
function vscodeAfterEach(name: string, fn: Function): void;
function vscodeAfterEach(name?: any, fn?: any): void {
	callHook('afterEach', name, fn);
}

/* The same hooks under the names of Mocha's TDD interface. */

function vscodeSuiteSetup(fn: Function): void;
function vscodeSuiteSetup(name: string, fn: Function): void;
function vscodeSuiteSetup(name?: any, fn?: any): void {
	callHook('before', name, fn, 'suiteSetup');
}

function vscodeSetup(fn: Function): void;
function vscodeSetup(name: string, fn: Function): void;
function vscodeSetup(name?: any, fn?: any): void {
	callHook('beforeEach', name, fn, 'setup');
}

function vscodeSuiteTeardown(fn: Function): void;
function vscodeSuiteTeardown(name: string, fn: Function): void;
function vscodeSuiteTeardown(name?: any, fn?: any): void {
	callHook('after', name, fn, 'suiteTeardown');
}

function vscodeTeardown(fn: Function): void;
function vscodeTeardown(name: string, fn: Function): void;
function vscodeTeardown(name?: any, fn?: any): void {
	callHook('afterEach', name, fn, 'teardown');
}

/**
 * Create new function which wraps original function. The wrapper function
 * will be able to create screenshots in case of test crashes.
 * @param hookType hook name
 * @param fn callback function
 * @returns wrapped function capable of doing screenshots on callback failure
 */
function createScreenshotCallbackFunction(name: string | undefined, hookType: HookType, fn: Function): Func {
	const alternativeFileName: string = createAlternativeFileName(hookType);

	return async function (this: Mocha.Context) {
		try {
			await fn.call(this);
		} catch (e) {
			if (this === undefined) {
				throw e;
			}
			if (this.test === undefined) {
				try {
					await VSBrowser.instance.takeScreenshot(sanitize(alternativeFileName));
				} catch (screenshotError) {
					console.error(`Could not take screenshot. this.test is undefined. Reason:\n${screenshotError}\n\n`);
				}
				throw e;
			}

			try {
				const titlePath = this.test.titlePath();
				await VSBrowser.instance.takeScreenshot(sanitize(titlePath.join('.')));
			} catch (screenshotError) {
				console.error(`Could not take screenshot. Reason:\n${screenshotError}\n\n`);
			}
			throw e;
		}
	};
}

/**
 * Call Mocha hook function with given arguments.
 * @param hookType hook name
 * @param firstArgument hook description or a callback
 * @param secondArgument callback to be called or undefined
 * @param functionName name of the ExTester function that was called, for error messages
 */
function callHook(
	hookType: HookType,
	firstArgument: string | Function | undefined,
	secondArgument: Function | undefined,
	functionName: string = hookType,
): void {
	/* Disallowed combinations */
	if (typeof firstArgument === 'function' && secondArgument !== undefined) {
		throw new Error(`${functionName}(func1, func2) If the first argument is a function, then the second argument must be undefined.`);
	}
	if (typeof firstArgument === 'string' && secondArgument === undefined) {
		throw new Error(`${functionName}(${firstArgument}) required callback function as seconds argument.`);
	}
	if (firstArgument === undefined && secondArgument === undefined) {
		throw new Error(`${functionName}() requires at least callback function.`);
	}
	/* Remaining 2 combinations are valid. eg. before(callback) and before(name, callback). */
	const name = typeof firstArgument === 'string' ? firstArgument : undefined;
	const fn = typeof firstArgument === 'function' ? firstArgument : secondArgument;

	const hook = getHookFunction(hookType);
	const callback = fn ? fn : () => {};

	if (name !== undefined) {
		hook(name, createScreenshotCallbackFunction(name, hookType, callback));
	} else {
		hook(createScreenshotCallbackFunction(name, hookType, callback));
	}
}

/**
 * Get Mocha's hook function of a kind of hook: the one of the BDD (or QUnit) interface, such as
 * `before`, or else the one of the TDD interface, such as `suiteSetup`. Mocha defines the functions
 * of one interface, the one its `ui` option selects, while it loads the test files.
 * @param hookType kind of the wanted hook function
 * @returns hook function
 */
function getHookFunction(hookType: HookType): Mocha.HookFunction {
	const names = mochaHookNames[hookType];
	if (names === undefined) {
		throw new Error(`Unknown hook type "${hookType}".`);
	}
	const mochaGlobals = globalThis as unknown as Record<string, unknown>;
	const name = names.find((candidate) => typeof mochaGlobals[candidate] === 'function');
	if (name === undefined) {
		throw new Error(
			`Mocha defines neither ${names[0]}() nor ${names[1]}(). Call ExTester's hooks in a test file that Mocha loads with its BDD, TDD or QUnit interface.`,
		);
	}
	return mochaGlobals[name] as Mocha.HookFunction;
}

/**
 * Create number generator [1..].
 */
function* createScreenshotNameGenerator(): Generator<number, number, void> {
	let counter = 1;

	while (true) {
		yield counter;
		counter++;
	}
}

/**
 * Create alternative filename if given hook does not have name.
 * @param hookType hook name
 * @returns alternative file name without extension
 */
function createAlternativeFileName(hookType: HookType): string {
	const generator = screenshotNameGenerators.get(hookType);

	if (generator) {
		return `${hookType} ${generator.next().value}`;
	} else {
		throw new Error(`Unknown mocha hook type "${hookType}".`);
	}
}

/**
 * Create number generator for each callback.
 */
const screenshotNameGenerators = new Map(
	Object.entries({
		before: createScreenshotNameGenerator(),
		beforeEach: createScreenshotNameGenerator(),
		after: createScreenshotNameGenerator(),
		afterEach: createScreenshotNameGenerator(),
	}),
);

export {
	vscodeBefore as before,
	vscodeBeforeEach as beforeEach,
	vscodeAfter as after,
	vscodeAfterEach as afterEach,
	vscodeSuiteSetup as suiteSetup,
	vscodeSetup as setup,
	vscodeSuiteTeardown as suiteTeardown,
	vscodeTeardown as teardown,
};
