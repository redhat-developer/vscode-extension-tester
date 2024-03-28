'use strict';

import * as fs from 'fs-extra';
import * as path from 'path';
import * as child_process from 'child_process';
import { Unpack } from './unpack';
import { Download } from './download';
import { DEFAULT_STORAGE_FOLDER } from '../extester';

/**
 * Handles version checks and download of ChromeDriver
 */
export class DriverUtil {
    private downloadFolder: string;

    /**
     * Create an instance of chrome driver handler
     * @param folder path to a folder to store all artifacts
     */
    constructor(folder: string = DEFAULT_STORAGE_FOLDER) {
        this.downloadFolder = path.resolve(folder);
    }

    /**
     * Find a matching ChromeDriver version for a given Chromium version and download it.
     * @param chromiumVersion version of Chromium to match the ChromeDriver against
     */
    async downloadChromeDriverForChromiumVersion(chromiumVersion: string): Promise<string> {
        const version = await this.getChromeDriverVersion(chromiumVersion);
        return await this.downloadChromeDriver(version);
    }

    /**
     * Download a given version ChromeDriver
     * @param version version to download
     */
    async downloadChromeDriver(version: string): Promise<string> {
        const url = this.getChromeDriverURL(version);
        const driverBinary = this.getChromeDriverBinaryPath(version);
        if (fs.existsSync(driverBinary)) {
            let localVersion = '';
            try {
                localVersion = await this.getLocalDriverVersion(version);
            } catch (err) {
                // ignore and download
            }
            if (localVersion.startsWith(version)) {
                console.log(`ChromeDriver ${version} exists in local cache, skipping download`);
                return '';
            }
        }
        fs.mkdirpSync(this.downloadFolder);

        const fileName = path.join(this.downloadFolder, path.basename(url));
        console.log(`Downloading ChromeDriver ${version} from: ${url}`);
        await Download.getFile(url, fileName, true);

        console.log(`Unpacking ChromeDriver ${version} into ${this.downloadFolder}`);
        await Unpack.unpack(fileName, this.downloadFolder);
        if (process.platform !== 'win32') {
            fs.chmodSync(driverBinary, 0o755);
        }
        console.log('Success!');
        return driverBinary;
    }

    private getChromeDriverBinaryPath(version: string): string {
        const majorVersion = this.getMajorVersion(version);
        const binary = process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
        let driverBinaryPath = path.join(this.downloadFolder, binary);
        if (+majorVersion > 114) {
            driverBinaryPath = path.join(this.downloadFolder, `chromedriver-${DriverUtil.getChromeDriverPlatform()}`, binary);
        }
        return driverBinaryPath;
    }

    static getChromeDriverPlatform(): string | undefined {
        switch (process.platform) {
            case 'darwin':
                return `mac-${process.arch}`;
            case 'win32':
                return process.arch === 'x64' ? 'win64' : 'win32';
            case 'linux':
                return 'linux64';
            default:
                break;
        }
        return undefined;
    }

    private static getChromeDriverPlatformOLD(): string | undefined {
        switch (process.platform) {
            case 'darwin':
                return process.arch === 'arm64' ? 'mac_arm64' : 'mac64';
            case 'win32':
                return 'win32';
            case 'linux':
                return 'linux64';
            default:
                break;
        }
        return undefined;
    }

    private getChromeDriverURL(version: string): string {
        const majorVersion = this.getMajorVersion(version);
        let driverPlatform = DriverUtil.getChromeDriverPlatformOLD();
        let url = `https://chromedriver.storage.googleapis.com/${version}/chromedriver_${driverPlatform}.zip`;
        if (+majorVersion > 114) {
            driverPlatform = DriverUtil.getChromeDriverPlatform();
            url = `https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/${version}/${driverPlatform}/chromedriver-${driverPlatform}.zip`
        }
        return url;
    }

    async checkDriverVersionOffline(version: string): Promise<string> {
        try {
            return await this.getLocalDriverVersion(version);
        } catch (err) {
            console.log('ERROR: Cannot find a copy of ChromeDriver in local cache in offline mode, exiting.')
            throw err;
        }
    }

    /**
     * Check local chrome driver version
     */
    private async getLocalDriverVersion(version: string): Promise<string> {
        const command = `${this.getChromeDriverBinaryPath(version)} -v`;
        return new Promise<string>((resolve, reject) => {
            child_process.exec(command, (err, stdout) => {
                if (err) return reject(err);
                resolve(stdout.split(' ')[1]);
            });
        });
        
    }

    /**
     * Find a matching version of ChromeDriver for a given Chromium version
     * @param chromiumVersion Chromium version to check against
     */
    private async getChromeDriverVersion(chromiumVersion: string): Promise<string> {
        const majorVersion = this.getMajorVersion(chromiumVersion);

        // chrome driver versioning has changed for chrome 70+
        if (+majorVersion < 70) {
            if (this.chromiumVersionMap[+majorVersion]) {
                return this.chromiumVersionMap[+majorVersion];
            } else {
                throw new Error(`Chromium version ${chromiumVersion} not supported`);
            }
        }
        let url = `https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${majorVersion}`;
        if (+majorVersion > 114) {
            url = `https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_${majorVersion}`;
        }
        const fileName = 'driverVersion';
        await Download.getFile(url, path.join(this.downloadFolder, fileName));
        return fs.readFileSync(path.join(this.downloadFolder, fileName)).toString();
    }

    private getMajorVersion(version: string): string {
        return version.split('.')[0];
    }

    // older chromedriver versions do not match chrome versions
    private readonly chromiumVersionMap: VersionMap = {
        69: '2.38',
        68: '2.38',
        67: '2.38',
        66: '2.38',
        65: '2.37',
        64: '2.36',
        63: '2.35',
        62: '2.34',
        61: '2.33',
        60: '2.32'
    }
}

interface VersionMap {
    [key:number]: string
}