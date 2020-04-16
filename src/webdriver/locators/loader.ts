import { Locators, LocatorDiff } from './locators';
import * as fs from 'fs-extra';
import * as path from 'path';
import compareVersions = require('compare-versions');
import { Merge, DeepPartial, DeepRequired } from 'ts-essentials';
const merge = require('merge-deep');

/**
 * Utility for loading locators for a given vscode version
 */
export class LocatorLoader {
    static readonly baseVersion = '1.37.0';
    private version: string;
    private locators: Locators;

    /**
     * Construct new loader for a given vscode version
     * @param version select version of vscode
     */
    constructor(version: string) {
        this.version = version;
        if (version.endsWith('-insider')) {
            this.version = version.substring(0, version.indexOf('-insider'));
        }
        const temp = require(`./versions/${LocatorLoader.baseVersion}`);
        this.locators = temp.locators as Locators;
    }

    /**
     * Loads locators for the selected vscode version
     * @returns object containing all locators
     */
    loadLocators(): Locators {
        let versions = fs.readdirSync(path.resolve(__dirname, 'versions'))
            .filter((file) => file.endsWith('.js'))
            .map((file) => path.basename(file, '.js'));
        
        if (compareVersions(LocatorLoader.baseVersion, this.version) === 0) {
            return this.locators;
        }

        if (compareVersions(LocatorLoader.baseVersion, this.version) < 0) {
            versions = versions.filter((ver) => 
                    compareVersions(LocatorLoader.baseVersion, ver) < 0 &&
                    compareVersions(ver, this.version) <= 0)
                .sort(compareVersions);
        } else {
            versions = versions.filter((ver) => 
                compareVersions(LocatorLoader.baseVersion, ver) > 0 &&
                compareVersions(ver, this.version) >= 0)
            .sort(compareVersions).reverse();
        }

        for (let i = 0; i < versions.length; i++) {
            const diff = require(`./versions/${versions[i]}`).diff as LocatorDiff;

            const newLocators: Merge<Locators, DeepPartial<Locators>> = merge(this.locators, diff.locators);
            this.locators = newLocators as DeepRequired<Merge<Locators, DeepPartial<Locators>>>;
        }
        return this.locators;
    }
}