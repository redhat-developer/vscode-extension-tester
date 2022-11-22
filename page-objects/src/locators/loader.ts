import { Locators, LocatorDiff } from './locators';
import * as fs from 'fs-extra';
import * as path from 'path';
import { compareVersions } from 'compare-versions';
import { Merge, DeepPartial, DeepRequired } from 'ts-essentials';
import clone = require('clone-deep');

/**
 * Utility for loading locators for a given vscode version
 */
export class LocatorLoader {
    private baseVersion: string;
    private baseFolder: string;
    private version: string;
    private locators: Locators;

    /**
     * Construct new loader for a given vscode version
     * @param version select version of vscode
     */
    constructor(version: string, baseVersion: string, baseFolder: string) {
        this.version = version;
        if (version.endsWith('-insider')) {
            this.version = version.substring(0, version.indexOf('-insider'));
        }
        this.baseVersion = baseVersion;
        this.baseFolder = path.resolve(baseFolder);
        const temp = require(path.resolve(baseFolder, baseVersion));
        this.locators = temp.locators as Locators;
    }

    /**
     * Loads locators for the selected vscode version
     * @returns object containing all locators
     */
    loadLocators(): Locators {
        let versions = fs.readdirSync(this.baseFolder)
            .filter((file) => file.endsWith('.js'))
            .map((file) => path.basename(file, '.js'));
        
        if (compareVersions(this.baseVersion, this.version) === 0) {
            return this.locators;
        }

        if (compareVersions(this.baseVersion, this.version) < 0) {
            versions = versions.filter((ver) => 
                    compareVersions(this.baseVersion, ver) < 0 &&
                    compareVersions(ver, this.version) <= 0)
                .sort(compareVersions);
        } else {
            versions = versions.filter((ver) => 
                compareVersions(this.baseVersion, ver) > 0 &&
                compareVersions(ver, this.version) >= 0)
            .sort(compareVersions).reverse();
        }

        for (let i = 0; i < versions.length; i++) {
            const diff = require(path.join(this.baseFolder, versions[i])).diff as LocatorDiff;

            const newLocators: Merge<Locators, DeepPartial<Locators>> = mergeLocators(this.locators, diff);
            this.locators = newLocators as DeepRequired<Merge<Locators, DeepPartial<Locators>>>;
        }
        return this.locators;
    }
}

function mergeLocators(original: Locators, diff: LocatorDiff): Locators {
    const target = clone(original);
    const targetDiff = diff.locators;

    merge(target, targetDiff) as Locators;
    return target;
}

function merge(target: any, obj: any) {
    for (const key in obj) {
        if (key === '__proto__' || !Object.prototype.hasOwnProperty.call(obj, key)) {
            continue;
        }

        let oldVal = obj[key];
        let newVal = target[key];

        if (typeof(newVal) === 'object' && typeof(oldVal) === 'object') {
            target[key] = merge(newVal, oldVal);
        } else {
            target[key] = clone(oldVal);
        }
    }
    return target;
}