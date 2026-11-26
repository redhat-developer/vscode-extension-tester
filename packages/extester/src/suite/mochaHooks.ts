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
import type { AsyncFunc, Func } from 'mocha';
import { HookCallback, HookType, withScreenshot } from './hookScreenshots';

/*
 * ExTester's hooks register Mocha's hook of the same kind, with a callback that takes a screenshot
 * when it fails. `extest` now takes that screenshot for every hook, so Mocha's own hooks do the
 * same and importing these is not needed. They are kept so that existing tests keep working.
 *
 * The overloads are those of Mocha's hook functions, one per kind of callback, so `this` is Mocha's
 * context without an annotation, as in `beforeEach(async function () { this.timeout(5000); })`.
 * A single overload for `Func | AsyncFunc` would leave `this` untyped in callbacks without `done`.
 */

function vscodeBefore(fn: Func): void;
function vscodeBefore(fn: AsyncFunc): void;
function vscodeBefore(name: string, fn: Func): void;
function vscodeBefore(name: string, fn: AsyncFunc): void;
function vscodeBefore(name?: any, fn?: any): void {
	callHook('before', name, fn);
}

function vscodeBeforeEach(fn: Func): void;
function vscodeBeforeEach(fn: AsyncFunc): void;
function vscodeBeforeEach(name: string, fn: Func): void;
function vscodeBeforeEach(name: string, fn: AsyncFunc): void;
function vscodeBeforeEach(name?: any, fn?: any): void {
	callHook('beforeEach', name, fn);
}

function vscodeAfter(fn: Func): void;
function vscodeAfter(fn: AsyncFunc): void;
function vscodeAfter(name: string, fn: Func): void;
function vscodeAfter(name: string, fn: AsyncFunc): void;
function vscodeAfter(name?: any, fn?: any): void {
	callHook('after', name, fn);
}

function vscodeAfterEach(fn: Func): void;
function vscodeAfterEach(fn: AsyncFunc): void;
function vscodeAfterEach(name: string, fn: Func): void;
function vscodeAfterEach(name: string, fn: AsyncFunc): void;
function vscodeAfterEach(name?: any, fn?: any): void {
	callHook('afterEach', name, fn);
}

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

/**
 * Call Mocha hook function with given arguments.
 * @param hookType hook name
 * @param firstArgument hook description or a callback
 * @param secondArgument callback to be called or undefined
 */
function callHook(hookType: HookType, firstArgument: string | HookCallback | undefined, secondArgument: HookCallback | undefined): void {
	/* Disallowed combinations */
	if (typeof firstArgument === 'function' && secondArgument !== undefined) {
		throw new Error(`${hookType}(func1, func2) If the first argument is a function, then the second argument must be undefined.`);
	}
	if (typeof firstArgument === 'string' && secondArgument === undefined) {
		throw new Error(`${hookType}(${firstArgument}) required callback function as seconds argument.`);
	}
	if (firstArgument === undefined && secondArgument === undefined) {
		throw new Error(`${hookType}() requires at least callback function.`);
	}
	/* Remaining 2 combinations are valid. eg. before(callback) and before(name, callback). */
	const name = typeof firstArgument === 'string' ? firstArgument : undefined;
	const fn = typeof firstArgument === 'function' ? firstArgument : secondArgument;

	const hook = getHookFunction(hookType);
	const callback = withScreenshot(hookType, fn ?? (() => {}));

	if (name !== undefined) {
		hook(name, callback);
	} else {
		hook(callback);
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

export { vscodeBefore as before, vscodeBeforeEach as beforeEach, vscodeAfter as after, vscodeAfterEach as afterEach };
