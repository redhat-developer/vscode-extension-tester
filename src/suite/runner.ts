'use strict';

import { VSBrowser } from '../webdriver/browser';
import * as fs from 'fs-extra';
import Mocha = require('mocha');
import * as glob from 'glob';

/**
 * Mocha runner wrapper
 */
export class VSRunner {
    private mocha: Mocha;
    private chromeBin: string;

    constructor(bin: string) {
        this.mocha = new Mocha();
        this.chromeBin = bin;
    }

    /**
     * Set up mocha suite, add vscode instance handling, run tests
     * @param testFilesPattern glob pattern of test files to run
     */
    runTests(testFilesPattern: string): void {
        let self = this;
        let browser: VSBrowser = new VSBrowser();
        let testFiles = glob.sync(testFilesPattern);

        testFiles.forEach((file) => {
            if (fs.existsSync(file) && file.substr(-3) === '.js') {
                this.mocha.addFile(file);
            }
        });

        this.mocha.suite.beforeAll(async function () {
            this.timeout(15000);
            await browser.start(self.chromeBin);
            await browser.waitForWorkbench();
        });

        this.mocha.suite.afterAll(async () => {
            await browser.quit();
        });

        this.mocha.run((failures) => {
            process.exitCode = failures ? 1 : 0;
        });
    }
}