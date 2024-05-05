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

import { expect } from 'chai';
import { error, TitleBar, VSBrowser } from 'vscode-extension-tester';
import * as os from 'os';
import * as path from 'path';

async function getTitle(): Promise<[string | undefined, Error | undefined]> {
    try {
        const titleBar = new TitleBar();
        const title = await titleBar.getTitle();
        return [title, undefined];
    }
    catch (e) {
        if (e instanceof error.InvalidSelectorError) {
            throw e;
        }
        return [undefined, new Error((e as Error).message)];
    }
}

describe('Open resource test', function () {
    this.timeout(30000);
    
    it('Single folder is open from CLI', async function() {
        let lastError = new Error('Could not get title from TitleBar.');
        const prefix = 'folder: ';

        await VSBrowser.instance.driver.wait(async () => {
            const [title, error] = await getTitle();
            lastError = error ?? lastError;

            const index = title?.indexOf(prefix) ?? 0;

            if (index > 0) {
                let openFolderPath = title?.slice(index + prefix.length);
                if (openFolderPath) {
                    if (openFolderPath.startsWith('~/')) {
                        openFolderPath = path.join(os.homedir(), openFolderPath.slice(2));
                    }

                    expect(openFolderPath.split(' ')[0]).equals(process.cwd());
                    return true;
                }
            }

            return false;
        }, this.timeout() - 2000, lastError.toString());
    });
});