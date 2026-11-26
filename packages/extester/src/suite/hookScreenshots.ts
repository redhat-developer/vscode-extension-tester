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

import type { AsyncFunc, Context, Done, Func, Hook, Runnable, Suite } from 'mocha';
import sanitize from 'sanitize-filename';
import { VSBrowser } from '../browser';

/** A hook callback: it takes Mocha's `done`, or returns nothing or a promise. */
export type HookCallback = Func | AsyncFunc;

/**
 * Limits of the screenshot of a failed hook. Internal: the tests shorten them.
 */
export const screenshotLimits = {
	/**
	 * How long the screenshot may take, in milliseconds. Mocha waits for it, even beyond the timeout of
	 * the hook, and then reports the error of the hook.
	 */
	timeout: 10_000,
};

/** Marks a callback that already takes a screenshot when it fails, so that it is not wrapped twice. */
const TAKES_SCREENSHOT = Symbol('extester.takesScreenshot');

type MarkedCallback = HookCallback & { [TAKES_SCREENSHOT]?: true };

/**
 * The events by which a Mocha suite reports a hook added to it, whatever interface added it. These
 * are the values of `Suite.constants`, the same in every Mocha version that ExTester supports.
 */
const HOOK_EVENTS = ['beforeAll', 'beforeEach', 'afterAll', 'afterEach'];

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
	for (const event of HOOK_EVENTS) {
		suite.on(event, (hook: Hook) => {
			if (hook.fn) {
				hook.fn = withScreenshot(hook.fn);
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
 * Failures that the callback does not report itself get no screenshot: a timeout, which Mocha
 * reports while the callback still runs, and an error thrown later outside the callback, such as
 * in a `setTimeout` callback of a hook that takes `done`, which Mocha catches as uncaught.
 *
 * @param fn The hook callback.
 * @returns The wrapped callback, or `fn` itself when it already takes a screenshot.
 */
export function withScreenshot(fn: HookCallback): HookCallback {
	if ((fn as MarkedCallback)[TAKES_SCREENSHOT]) {
		return fn;
	}
	let wrapped: MarkedCallback;
	if (fn.length > 0) {
		// Mocha passes `done` only to a callback that declares it.
		wrapped = function (this: Context, done: Done) {
			// The hooks and tests of a suite share `this`: read the hook before Mocha can go on to another.
			const hook = this?.test;
			const fail = (error: unknown) => void takeScreenshot(hook).then(() => done(error));
			try {
				return (fn as Func).call(this, (error?: unknown) => (error ? fail(error) : done()));
			} catch (error) {
				// `this.skip()` already ended the hook. Mocha turns a falsy exception into its own error.
				if (!error || hook?.isPending()) {
					throw error;
				}
				fail(error);
			}
		};
	} else {
		wrapped = async function (this: Context) {
			// The hooks and tests of a suite share `this`: read the hook before Mocha can go on to another.
			const hook = this?.test;
			try {
				await (fn as AsyncFunc).call(this);
			} catch (error) {
				if (!hook?.isPending()) {
					await takeScreenshot(hook);
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

/**
 * Takes a screenshot of a failed hook, named after the titles of its suites and its own title.
 *
 * Mocha's timer of the hook keeps running meanwhile, and would replace the error of the hook with a
 * timeout. Setting the timeout of a runnable restarts its timer, so the hook gets the time of the
 * screenshot, which is given up after {@link screenshotLimits}, and then its own timeout again.
 *
 * @param hook The failed hook.
 */
async function takeScreenshot(hook: Runnable | undefined): Promise<void> {
	// After a timeout, Mocha reported the hook and went on: the window shows what runs now.
	if (!hook || hook.timedOut) {
		return;
	}
	const limit = screenshotLimits.timeout;
	const hookTimeout = hook.timeout();
	if (hookTimeout > 0) {
		hook.timeout(limit + 1000);
	}
	let timer: NodeJS.Timeout | undefined;
	try {
		await Promise.race([
			VSBrowser.instance.takeScreenshot(sanitize(hook.titlePath().join('.'))),
			new Promise((_resolve, reject) => {
				timer = setTimeout(() => reject(new Error(`It did not end within ${limit} ms.`)), limit);
			}),
		]);
	} catch (screenshotError) {
		console.error(`Could not take screenshot. Reason:\n${screenshotError}\n\n`);
	} finally {
		clearTimeout(timer);
		if (hookTimeout > 0) {
			hook.timeout(hookTimeout);
		}
	}
}
