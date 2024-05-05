/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Locators, LocatorDiff } from './locators';
import * as fs from 'fs-extra';
import * as path from 'path';
import { compareVersions } from 'compare-versions';
import { Merge, PartialDeep, RequiredDeep } from 'type-fest';
import clone from 'clone-deep';

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

        for (const version of versions) {
            const diff = require(path.join(this.baseFolder, version)).diff as LocatorDiff;

            const newLocators: Merge<Locators, PartialDeep<Locators>> = mergeLocators(this.locators, diff);
            this.locators = newLocators as RequiredDeep<Merge<Locators, PartialDeep<Locators>>>;
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

        const oldVal = obj[key];
        const newVal = target[key];

        if (typeof(newVal) === 'object' && typeof(oldVal) === 'object') {
            target[key] = merge(newVal, oldVal);
        } else {
            target[key] = clone(oldVal);
        }
    }
    return target;
}