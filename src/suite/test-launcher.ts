'use strict';

import { Browser } from '../webdriver/browser';
import * as fs from 'fs-extra';
import Mocha = require('mocha');
import * as glob from 'glob';

export class Runner {
    private mocha: Mocha;
    private chromeBin: string;

    constructor(bin: string) {
        this.mocha = new Mocha();
        this.chromeBin = bin;
    }

    run(testFilesPattern: string): void {
        let self = this;
        let browser: Browser = new Browser();
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