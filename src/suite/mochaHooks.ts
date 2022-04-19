import { Func } from 'mocha';
import { VSBrowser } from '../extester';

type HookType = 'before' | 'beforeEach' | 'after' | 'afterEach';

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
            await fn();
        }
        catch (e) {
            if (this === undefined) throw e;
            if (this.test === undefined) {
                try {
                    await VSBrowser.instance.takeScreenshot(alternativeFileName);
                }
                catch (screenshotError) {
                    console.error(`Could not take screenshot. this.test is undefined. Reason:\n${screenshotError}\n\n`);
                }
                throw e;
            }

            try {
                const titlePath = this.test.titlePath();
                await VSBrowser.instance.takeScreenshot(titlePath.join('.'));
            }
            catch (screenshotError) {
                console.error(`Could not take screenshot. Reason:\n${screenshotError}\n\n`);
            }
            throw e;
        }
    }
}

/**
 * Call Mocha hook function with given arguments.
 * @param hookType hook name
 * @param firstArgument hook description or a callback
 * @param secondArgument callback to be called or undefined
 */
function callHook(hookType: HookType, firstArgument: string | Function | undefined, secondArgument: Function | undefined): void {
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
    const name = (typeof firstArgument === 'string') ? (firstArgument) : (undefined);
    const fn = (typeof firstArgument === 'function') ? (firstArgument) : (secondArgument);

    const hook = getHookFunction(hookType);
    const callback = fn ? createScreenshotCallbackFunction(name, hookType, fn) : (() => { });

    if (name !== undefined) {
        hook(name, createScreenshotCallbackFunction(name, hookType, callback));
    }
    else {
        hook(createScreenshotCallbackFunction(name, hookType, callback));
    }
}

/**
 * Get hook function from hook name.
 * @param hookType name of wanted hook function
 * @returns hook function
 */
function getHookFunction(hookType: HookType): Mocha.HookFunction {
    switch (hookType) {
        case 'before': return before;
        case 'beforeEach': return beforeEach;
        case 'after': return after;
        case 'afterEach': return afterEach;
        default:
            throw new Error(`Unknown hook type "${hookType}".`);
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
 * Create alternative filename if given hook does not have name.
 * @param hookType hook name
 * @returns alternative file name without extension
 */
function createAlternativeFileName(hookType: HookType): string {
    const generator = screenshotNameGenerators.get(hookType);

    if (generator) {
        return `${hookType} ${generator.next().value}`;
    }
    else {
        throw new Error(`Unknown mocha hook type "${hookType}".`);
    }
}

/**
 * Create number generator for each callback.
 */
const screenshotNameGenerators = new Map(Object.entries({
    "before": createScreenshotNameGenerator(),
    "beforeEach": createScreenshotNameGenerator(),
    "after": createScreenshotNameGenerator(),
    "afterEach": createScreenshotNameGenerator()
}));

export { vscodeBefore as before, vscodeBeforeEach as beforeEach, vscodeAfter as after, vscodeAfterEach as afterEach };
