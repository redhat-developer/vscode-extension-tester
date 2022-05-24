import * as path from "path";
import * as fs from "fs";
import { ExTester } from "vscode-extension-tester";

/**
 * Test folder.
 */
const MOCHA_FOLDER = path.join(__dirname, 'mocha');

/**
 * List of all base hooks.
 */
const HOOKS = ['before', 'beforeEach'];

/**
 * Allowed hook segments.
 */
const ALLOWED_HOOK_SEGMENTS = ['before', 'after', 'each'];

/**
 * The longest hook usage name.
 */
const LONGEST_HOOK = 'beforeEachNestedAnonymous';

/**
 * The storage location used for UI tests
 */
const UITEST_STORAGE = 'test-resources';

async function main() {
    const tester = new ExTester(UITEST_STORAGE);
    await tester.downloadCode();
    await tester.downloadChromeDriver();
    let results = new Map<string, number>();
    let errors = new Map<string, Error[]>();

    for (const [hookName, expectedScreenshotFilename] of getTests().entries()) {
        const testFile = path.join(MOCHA_FOLDER, `${hookName}.js`);
        try {
            if (!fs.existsSync(testFile)) throw new Error(`Test file "${testFile}" does not exist.`);

            const result = await tester.runTests(testFile, {
                cleanup: false
            });
            
            if (fs.existsSync(path.join(UITEST_STORAGE, 'screenshots', expectedScreenshotFilename))) {
                errors.set(hookName, []);
            }
            else {
                errors.set(hookName, [new Error(`Screenshot "${expectedScreenshotFilename}" was not created.`)]);
            }
            results.set(hookName, result);
        }
        catch (e) {
            errors.set(hookName, [e]);
            results.set(hookName, 2);
        }
    }

    process.exitCode = Array.from(errors.values()).filter((x) => x.length !== 0).length;

    for (const [hook, errorList] of errors.entries()) {
        const result = results.get(hook);

        if (result === 0) {
            errorList.push(new Error(`${hook} did not throw anything.`));
        }
        
        reportTestStatus(hook, errorList.length > 0 ? 'FAIL' : 'SUCCESS');
        if (errorList.length > 0) {
            console.error('\t' + errorList.map((e) => e.toString()).join('\n\t') + '\n');
        }
    }

    console.log(`Passed: ${errors.size - process.exitCode}`);
    console.log(`Failed: ${process.exitCode}`);
    console.log(`Total : ${errors.size}`);
}

/**
 * Create new map which maps specific hook usage to expected screenshot name.
 * @returns Map which maps specific hook usage to expected screenshot name.
 */
function getTests(): Map<string, string> {
    const tests = new Map<string, string>();

    const nestedHooks = HOOKS.map((hook) => hook + 'Nested');
    const anonymousHooks = HOOKS.map((hook) => hook + 'Anonymous')
    const nestedAnonymousHooks = nestedHooks.map((hook) => hook + 'Anonymous')
    HOOKS.forEach((hook) => tests.set(hook, filenameTemplate(hook)));
    nestedHooks.forEach((hook) => tests.set(hook, filenameNestingTemplate(hook)));
    anonymousHooks.forEach((hook) => tests.set(hook, filenameAnonymousTemplate(hook)));
    nestedAnonymousHooks.forEach((hook) => tests.set(hook, filenameNestingAnonymousTemplate(hook)));
    return tests;
}

/**
 * Print test result to terminal.
 * @param hook Hook usage name.
 * @param status Test result. 
 */
function reportTestStatus(hook: string, status: string) : void {
    const length = LONGEST_HOOK.length;
    const diff = length - hook.length;
    const spacing = Array(diff).fill(' ');
    console.log(`${hook}${spacing.join('')}\t... ${status}`);
}

/**
 * Split hook usage name into segments.
 * @param hook Hook usage name.
 * @returns Hook usage segments splitted by upper case letters.
 */
function hookIntoSegments(hook: string): string[] {
    return hook.match(/([A-Z]?[^A-Z]*)/g).slice(0,-1)
}

/**
 * Transform hook usage name to Mocha name.
 * @param hookSegments Hook usage segments.
 * @returns Mocha hook name.
 */
function hookSegmentsToMochaName(hookSegments: string[]) : string {
    if (hookSegments.length === 0) {
        throw new Error('Not implemented. Undefined.');
    }

    const isBeforeOrAnyFirst = hookSegments[0] === 'before' || hookSegments[0] === 'after';

    // before/after => before/after all
    if (hookSegments.length == 1 && isBeforeOrAnyFirst) {
        return [...hookSegments, 'all'].join(' ');
    }

    return hookSegments.join(' ');
}

/**
 * Transform hook usage name to Mocha name.
 * @param hook Hook usage name.
 * @returns Mocha hook name.
 */
function hookNameToTemplateValidName(hook: string): string {
    const hookSegments = hookIntoSegments(hook)
        .map((x) => x.toLowerCase())
        // Remove segments which are not part of Mocha name.
        .filter((x) => ALLOWED_HOOK_SEGMENTS.includes(x));
    return hookSegmentsToMochaName(hookSegments);
}

function filenameNestingTemplate(hook: string) {
    return `${hook}.Second level.Third level."${hookNameToTemplateValidName(hook)}" hook: Hook under test for "Hello world".png`;
}

function filenameTemplate(hook: string) {
    return `${hook}."${hookNameToTemplateValidName(hook)}" hook: Hook under test for "Hello world".png`;
}

function filenameAnonymousTemplate(hook: string) {
    return `${hook}."${hookNameToTemplateValidName(hook)}" hook for "Hello world".png`;
}

function filenameNestingAnonymousTemplate(hook: string) {
    return `${hook}.Second level.Third level."${hookNameToTemplateValidName(hook)}" hook for "Hello world".png`;
}

main();
