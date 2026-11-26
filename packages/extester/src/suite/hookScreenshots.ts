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

import type { AsyncFunc, Context, Done, Func, Hook, Suite } from 'mocha';
import sanitize from 'sanitize-filename';
import { VSBrowser } from '../browser';

/** The kinds of Mocha hooks, named as in Mocha's BDD interface. */
export type HookType = 'before' | 'beforeEach' | 'after' | 'afterEach';

/** A hook callback: it takes Mocha's `done`, or returns nothing or a promise. */
export type HookCallback = Func | AsyncFunc;

/** Marks a callback that already takes a screenshot when it fails, so that it is not wrapped twice. */
const TAKES_SCREENSHOT = Symbol('extester.takesScreenshot');

type MarkedCallback = HookCallback & { [TAKES_SCREENSHOT]?: true };

/**
 * The events by which a Mocha suite reports a hook added to it, whatever interface added it, and the
 * kind of the hook. These are the values of `Suite.constants`, the same in every Mocha version that
 * ExTester supports.
 */
const HOOK_EVENTS: Record<string, HookType> = {
	beforeAll: 'before',
	beforeEach: 'beforeEach',
	afterAll: 'after',
	afterEach: 'afterEach',
};

/** The event by which a Mocha suite reports a suite added to it. */
const SUITE_EVENT = 'suite';

/**
 * Takes a screenshot when a hook of the suite, or of a suite added to it later, fails: every hook,
 * whichever Mocha interface defines it (`before` or `suiteSetup`, for example), and whether it is
 * Mocha's own hook function or one imported from ExTester. Hooks added before this call, such as
 * ExTester's own hooks of the root suite, are left as they are.
 *
 * @param suite The suite, usually Mocha's root suite before the test files are loaded.
 */
export function takeScreenshotsOfFailedHooks(suite: Suite): void {
	for (const [event, hookType] of Object.entries(HOOK_EVENTS)) {
		suite.on(event, (hook: Hook) => {
			if (hook.fn) {
				hook.fn = withScreenshot(hookType, hook.fn);
			}
		});
	}
	suite.on(SUITE_EVENT, (child: Suite) => takeScreenshotsOfFailedHooks(child));
}

/**
 * Wraps a hook callback so that a screenshot is taken when it fails, before Mocha goes on. The
 * wrapper has the same `this` and takes `done` when the callback does, so Mocha runs it as it runs
 * the callback, and `this.timeout()` and `this.skip()` work as usual. Skipping takes no screenshot.
 *
 * @param hookType The kind of the hook, used in the name of the screenshot when the hook has no title.
 * @param fn The hook callback.
 * @returns The wrapped callback, or `fn` itself when it already takes a screenshot.
 */
export function withScreenshot(hookType: HookType, fn: HookCallback): HookCallback {
	if ((fn as MarkedCallback)[TAKES_SCREENSHOT]) {
		return fn;
	}
	const alternativeFileName = createAlternativeFileName(hookType);
	let wrapped: MarkedCallback;
	if (fn.length > 0) {
		// Mocha passes `done` only to a callback that declares it.
		wrapped = function (this: Context, done: Done) {
			const finish = (error?: unknown) => {
				if (!error) {
					done();
				} else {
					void takeScreenshot(this, alternativeFileName).then(() => done(error));
				}
			};
			try {
				return (fn as Func).call(this, finish);
			} catch (error) {
				if (isSkipped(this)) {
					throw error; // `this.skip()` already ended the hook
				}
				finish(error);
			}
		};
	} else {
		wrapped = async function (this: Context) {
			try {
				await (fn as AsyncFunc).call(this);
			} catch (error) {
				if (!isSkipped(this)) {
					await takeScreenshot(this, alternativeFileName);
				}
				throw error;
			}
		};
	}
	// Mocha titles a hook without a title after its callback, as in `"before all" hook: openEditor`.
	Object.defineProperty(wrapped, 'name', { value: fn.name });
	wrapped[TAKES_SCREENSHOT] = true;
	return wrapped;
}

/** Whether the hook that runs in a context called `this.skip()`, which Mocha implements by throwing. */
function isSkipped(context: Context | undefined): boolean {
	return context?.test?.isPending() ?? false;
}

/**
 * Takes a screenshot of a failed hook, named after the titles of its suites and its own title.
 */
async function takeScreenshot(context: Context | undefined, alternativeFileName: string): Promise<void> {
	if (context === undefined) {
		return;
	}
	try {
		const name = context.test ? context.test.titlePath().join('.') : alternativeFileName;
		await VSBrowser.instance.takeScreenshot(sanitize(name));
	} catch (screenshotError) {
		console.error(`Could not take screenshot. Reason:\n${screenshotError}\n\n`);
	}
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
 * Create number generator for each callback.
 */
const screenshotNameGenerators = new Map<HookType, Generator<number, number, void>>([
	['before', createScreenshotNameGenerator()],
	['beforeEach', createScreenshotNameGenerator()],
	['after', createScreenshotNameGenerator()],
	['afterEach', createScreenshotNameGenerator()],
]);

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
