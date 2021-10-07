'use strict';

import { VSBrowser } from '../browser';
import * as fs from 'fs-extra';
import Mocha = require('mocha');
import * as glob from 'glob';
import { CodeUtil, ReleaseQuality } from '../util/codeUtil';
import * as path from 'path';
import * as yaml from 'js-yaml';
import sanitize = require('sanitize-filename');
import { logging } from 'selenium-webdriver';
import * as os from 'os';

/**
 * Mocha runner wrapper
 */
export class VSRunner {
    private mocha: Mocha;
    private chromeBin: string;
    private customSettings: Object;
    private codeVersion: string;
    private cleanup: boolean;
    private tmpLink = path.join(os.tmpdir(), 'extest-code');
    private releaseType: ReleaseQuality;

    constructor(bin: string, codeVersion: string, customSettings: Object = {}, cleanup: boolean = false, releaseType: ReleaseQuality, config?: string) {
        const conf = this.loadConfig(config);
        this.mocha = new Mocha(conf);
        this.chromeBin = bin;
        this.customSettings = customSettings;
        this.codeVersion = codeVersion;
        this.cleanup = cleanup;
        this.releaseType = releaseType;
    }

    /**
     * Set up mocha suite, add vscode instance handling, run tests
     * @param testFilesPattern glob pattern of test files to run
     * @param logLevel The logging level for the Webdriver
     * @return The exit code of the mocha process
     */
    runTests(testFilesPattern: string, code: CodeUtil, logLevel: logging.Level = logging.Level.INFO): Promise<number> {
        return new Promise(resolve => {
            let self = this;
            let browser: VSBrowser = new VSBrowser(this.codeVersion, this.releaseType, this.customSettings, logLevel);
            const universalPattern = testFilesPattern.replace(/'/g, '');
            const testFiles = glob.sync(universalPattern);
    
            testFiles.forEach((file) => {
                if (fs.existsSync(file) && file.substr(-3) === '.js') {
                    this.mocha.addFile(file);
                }
            });
    
            this.mocha.suite.afterEach(async function () {
                if (this.currentTest && this.currentTest.state !== 'passed') {
                    try {
                        const filename = sanitize(this.currentTest.fullTitle());
                        await browser.takeScreenshot(filename);
                    } catch (err) {
                        console.log('Screenshot capture failed.', err);
                    }
                }
            });
    
            this.mocha.suite.beforeAll(async function () {
                this.timeout(45000);
                const start = Date.now();
                const binPath = process.platform === 'darwin' ? await self.createShortcut(code.getCodeFolder(), self.tmpLink) : self.chromeBin;
                await browser.start(binPath);
                await browser.waitForWorkbench();
                await new Promise((res) => { setTimeout(res, 2000); });
                console.log(`Browser ready in ${Date.now() - start} ms`);
                console.log('Launching tests...');
            });
    
            this.mocha.suite.afterAll(async function() {
                this.timeout(15000);
                await browser.quit();
                if (process.platform === 'darwin') {
                    if (await fs.pathExists(self.tmpLink)) {
                        try {
                            fs.unlinkSync(self.tmpLink);
                        } catch (err) {
                            console.log(err);
                        }
                    }
                }
    
                code.uninstallExtension(self.cleanup);
            });
    
            this.mocha.run((failures) => {
                process.exitCode = failures ? 1 : 0;
                resolve(process.exitCode);
            });
        });
    }

    private async createShortcut(src: string, dest: string): Promise<string> {
        try {
            await fs.ensureSymlink(src, dest, 'dir');
        } catch (err) {
            return this.chromeBin;
        }
        
        const dir = path.parse(src);
        const segments = this.chromeBin.split(path.sep);
        const newSegments = dest.split(path.sep);
        
        let found = false;
        for (let i = 0; i < segments.length; i++) {
            if (!found) {
                found = segments[i] === dir.base;
            } else {
                newSegments.push(segments[i]);
            }
        }
        return path.join(dir.root, ...newSegments);
    }

    private loadConfig(config?: string): Mocha.MochaOptions {
        const defaultFiles = ['.mocharc.js', '.mocharc.json', '.mocharc.yml', '.mocharc.yaml']
        let conf: Mocha.MochaOptions = {};
        let file = config;
        if (!config) {
            file = path.resolve('.')
            for (let i = 0; i < defaultFiles.length; i++) {
                if (fs.existsSync(path.join(file, defaultFiles[i]))) {
                    file = path.join(file, defaultFiles[i]);
                    break;
                }
            }
        }

        if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
            console.log(`Loading mocha configuration from ${file}`);
            if (/\.(yml|yaml)$/.test(file)) {
                try {
                    conf = yaml.load(fs.readFileSync(file, 'utf-8')) as Mocha.MochaOptions;
                } catch (err) {
                    console.log('Invalid mocha configuration file, will be ignored');
                }
            } else if (/\.(js|json)$/.test(file)) {
                try {
                    conf = require(path.resolve(file));
                } catch (err) {
                    console.log('Invalid mocha configuration file, will be ignored');
                }
            } else {
                console.log('Unsupported mocha configuration file extension, make sure to use .js, .json, .yml or .yaml file');
            }
        }
        return conf;
    }
}
