'use strict';

import request = require("request");
import * as fs from 'fs-extra';
import * as path from 'path';
import * as child_process from 'child_process';
import { VSRunner } from "../suite/runner";
import { Unpack } from "./unpack";

export enum ReleaseQuality {
    Stable = 'stable',
    Insider = 'insider'
}

/**
 * Handles the VS Code instance used for testing.
 * Includes downloading, unpacking, launching, and version checks.
 */
export class CodeUtil {
    private codeFolder: string;
    private downloadPlatform: string;
    private downloadFolder: string;
    private executablePath!: string;
    private cliPath!: string;
    private cliEnv!: string;
    private availableVersions: { stable: string[], insider: string[] };

    /**
     * Create an instance of code handler 
     * @param folder Path to folder where all the artifacts will be stored.
     */
    constructor(folder: string = 'test-resources') {
        this.availableVersions = { stable: [], insider: [] };
        this.downloadPlatform = this.getPlatform();
        this.downloadFolder = path.resolve(folder);
        this.codeFolder = path.join(this.downloadFolder, (process.platform === 'darwin')
            ? 'Visual Studio Code.app' : `VSCode-${this.downloadPlatform}`);
        this.findExecutables();
    }

    /**
     * Get all versions for the given release stream
     * 
     * @param quality denotes whether stable or insiders stream is selected
     */
    async getVSCodeVersions(quality: ReleaseQuality): Promise<string[]> {
        const apiUrl = `https://vscode-update.azurewebsites.net/api/releases/${quality}`;
        const headers = {
            'user-agent': 'nodejs'
        };
    
        return new Promise<string>((resolve, reject) => {
            request.get({ url: apiUrl, headers: headers }, (error, response, body) => {
                if (!error && response && response.statusCode >= 400) {
                    error = new Error(`Request returned status code: ${response.statusCode}\nDetails: ${response.body}`);
                    reject(error);
                }
                resolve(body);
            });
        }).then((json) => {
            return JSON.parse(json);
        });
    }

    /**
     * Download and unpack VS Code for testing purposes
     * 
     * @param version VS Code version to get, default latest
     * @param quality Chooses stable or insiders stream, default stable
     */
    async downloadVSCode(version: string = 'latest', quality: ReleaseQuality = ReleaseQuality.Stable): Promise<void> {
        if (this.availableVersions[quality].length < 1) {
            this.availableVersions[quality] = await this.getVSCodeVersions(quality);
        }
        if (version !== 'latest' && this.availableVersions[quality].indexOf(version) < 0) {
            throw new Error(`Version ${version} is not available in ${quality} stream`);
        }

        const literalVersion = version === 'latest' ? this.availableVersions[quality][0] : version;
        if (!fs.existsSync(this.executablePath) || await this.getExistingCodeVersion() !== literalVersion) {
            fs.mkdirpSync(this.downloadFolder);

            const url = ['https://vscode-update.azurewebsites.net', version, this.downloadPlatform, quality].join('/');
            const isTarGz = this.downloadPlatform.indexOf('linux') > -1;
            const fileName = `${path.basename(url)}.${isTarGz ? 'tar.gz' : 'zip'}`;
    
            console.log(`Downloading VS Code from: ${url}`);
            await new Promise<void>((resolve) => {
                request.get(url)
                    .pipe(fs.createWriteStream(path.join(this.downloadFolder, fileName)))
                    .on('close', resolve);
            });
            console.log(`Downloaded VS Code into ${path.join(this.downloadFolder, fileName)}`);
    
            console.log(`Unpacking VS Code into ${this.downloadFolder}`);
            let target = this.downloadFolder;
            if (process.platform === 'win32') {
                target = path.join(this.downloadFolder, `VSCode-${this.downloadPlatform}`);
                fs.mkdirpSync(target);
            }
            await Unpack.unpack(path.join(this.downloadFolder, fileName), target);
            console.log('Success!');
        } else {
            console.log('VS Code exists in local cache, skipping download');
        }
    }

    /**
     * Install your extension into the test instance of VS Code
     */
    installExtension(vsix?: string): void {
        const pjson = require(path.resolve('package.json'));
        const vsixPath = path.resolve(vsix ? vsix : `${pjson.name}-${pjson.version}.vsix`);
        const command = `${this.cliEnv} ${this.executablePath} ${this.cliPath} --install-extension ${vsixPath}`;
        
        console.log(`Installing ${pjson.name}-${pjson.version}.vsix`);
        child_process.execSync(command, { stdio: 'inherit' });
    }

    packageExtension(): void {
        // add vsce to process' path
        const binFolder = path.join(__dirname, '..', '..', 'node_modules', '.bin');
        const finalEnv: NodeJS.ProcessEnv = {};
        Object.assign(finalEnv, process.env);
        const key = process.platform === 'win32' ? 'Path' : 'PATH';
        finalEnv[key] = [binFolder, process.env[key]].join(path.delimiter);

        child_process.execSync('vsce package', { stdio: 'inherit', env: finalEnv });
    }

    /**
     * Run tests in your test environment using mocha
     * 
     * @param testFilesPattern glob pattern of test files to run
     * @param settings path to custom settings json file
     */
    runTests(testFilesPattern: string, settings: string = ''): void {
        // add chromedriver to process' path
        const finalEnv: NodeJS.ProcessEnv = {};
        Object.assign(finalEnv, process.env);
        const key = process.platform === 'win32' ? 'Path' : 'PATH';
        finalEnv[key] = [this.downloadFolder, process.env[key]].join(path.delimiter);
    
        process.env = finalEnv;
        process.env.TEST_RESOURCES = this.downloadFolder;
        const runner = new VSRunner(this.executablePath, this.parseSettings(settings));
        runner.runTests(testFilesPattern);
    }

    /**
     * Finds the version of chromium used for given VS Code version.
     * Works only for versions 1.30+, older versions need to be checked manually
     * 
     * @param codeVersion version of VS Code, default latest
     * @param quality release stream, default stable
     */
    async getChromiumVersion(codeVersion: string = 'latest', quality: ReleaseQuality = ReleaseQuality.Stable): Promise<string> {
        if (this.availableVersions[quality].length < 1) {
            this.availableVersions[quality] = await this.getVSCodeVersions(quality);
        }
        if (codeVersion !== 'latest' && this.availableVersions[quality].indexOf(codeVersion) < 0) {
            throw new Error(`VSCode version ${codeVersion} is not available in ${quality} stream`);
        }
        const literalVersion = codeVersion === 'latest' ? this.availableVersions[quality][0] : codeVersion;

        const fileName = 'manifest.json';
        const url = `https://raw.githubusercontent.com/Microsoft/vscode/${literalVersion}/cgmanifest.json`;
        await new Promise<void>((resolve) => {
            request.get(url)
                .pipe(fs.createWriteStream(path.join(this.downloadFolder, fileName)))
                .on('close', resolve);
        });
        const manifest = require(path.join(this.downloadFolder, fileName));
        return manifest.registrations[0].version;
    }

    /**
     * Check what VS Code version is present in the testing folder
     */
    private getExistingCodeVersion(): Promise<string> {
        const command = [this.cliEnv, `"${this.executablePath}"`, `"${this.cliPath}"`, '-v'].join(' ');
        return new Promise<string>((resolve, reject) => {
            child_process.exec(command, (err, stdout) => {
                if (err) return reject(err);
                resolve(stdout.split('\n')[0]);
            });
        })
    }

    /**
     * Construct the platform string based on OS
     */
    private getPlatform(): string {
        let platform: string = process.platform;
        const arch = process.arch;
        this.cliEnv = 'ELECTRON_RUN_AS_NODE=1';

        if (platform === 'linux') {
            platform += arch === 'x64' ? `-${arch}` : `-ia32`;
        } else if (platform === 'win32') {
            platform += arch === 'x64' ? `-${arch}` : '';
            platform += '-archive';
            this.cliEnv = `set ${this.cliEnv} &&`;
        }

        return platform;
    }

    /**
     * Setup paths specific to used OS
     */
    private findExecutables(): void {
        this.cliPath = path.join(this.codeFolder, 'resources', 'app', 'out', 'cli.js');
        switch (process.platform) {
            case 'darwin':
                this.executablePath = path.join(this.codeFolder, 'Contents', 'MacOS', 'Electron');
                this.cliPath = path.join(this.codeFolder, 'Contents', 'Resources', 'app', 'out', 'cli.js');
                break;
            case 'win32':
                this.executablePath = path.join(this.codeFolder, 'Code.exe');
                break;
            case 'linux':
                this.executablePath = path.join(this.codeFolder, 'code');
                break;
        }
    }

    /**
     * Parse JSON from a file
     * @param path path to json file
     */
    private parseSettings(path: string): Object {
        if (!path) {
            return {};
        }
        let text = '';
        try {
            text = fs.readFileSync(path).toString();
        } catch (err) {
            throw new Error(`Unable to read settings from ${path}:\n ${err}`);
        }
        try {
            return JSON.parse(text);
        } catch (err) {
            throw new Error(`Error parsing the settings file from ${path}:\n ${err}`);
        }
    }
}