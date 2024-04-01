'use strict';

import { VSBrowser } from '../browser';
import * as fs from 'fs-extra';
import Mocha from 'mocha';
import { globSync } from 'glob';
import { CodeUtil, ReleaseQuality } from '../util/codeUtil';
import * as path from 'path';
import * as yaml from 'js-yaml';
import sanitize from 'sanitize-filename';
import { logging } from 'selenium-webdriver';
import * as os from 'os';
import { Coverage } from '../util/coverage';

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
    runTests(testFilesPattern: string[], code: CodeUtil, logLevel: logging.Level = logging.Level.INFO, resources: string[]): Promise<number> {
        return new Promise(resolve => {
            let self = this;
            let browser: VSBrowser = new VSBrowser(this.codeVersion, this.releaseType, this.customSettings, logLevel);
            let coverage: Coverage | undefined;

            const testFiles = new Set<string>();
            for (const pattern of testFilesPattern) {
                const universalPattern = pattern.replace(/'/g, '');
                globSync(universalPattern).reverse()
                    .forEach((val) => testFiles.add(val));
            }

            testFiles.forEach((file) => this.mocha.addFile(file));
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
                this.timeout(180000);

                if (code.coverageEnabled) {
                    coverage = new Coverage();
                    process.env.NODE_V8_COVERAGE = coverage?.targetDir;    
                }
    
                const start = Date.now();
                const binPath = process.platform === 'darwin' ? await self.createShortcut(code.getCodeFolder(), self.tmpLink) : self.chromeBin;
                await browser.start(binPath);
                await browser.openResources(...resources);
                await browser.waitForWorkbench();
                await new Promise((res) => { setTimeout(res, 3000); });
                console.log(`Browser ready in ${Date.now() - start} ms`);
                console.log('Launching tests...');
            });

            this.mocha.suite.afterAll(async function () {
                this.timeout(180000);
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

                if (!code.extensionDevPath) {
                    code.uninstallExtension(self.cleanup);
                }
                await coverage?.write();
            });

            this.mocha.run((failures) => {
                process.exitCode = failures ? 1 : 0;
                if(process.exitCode) {
                    console.log(
                        '\x1b[33m%s\x1b[0m',
                        `INFO: Screenshots of failures can be found in: ${browser.getScreenshotsDir()}\n`
                    );
                }
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
        for (let segment of segments) {
            if (!found) {
                found = segment === dir.base;
            } else {
                newSegments.push(segment);
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
            for (let defFile of defaultFiles) {
                if (fs.existsSync(path.join(file, defFile))) {
                    file = path.join(file, defFile);
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
