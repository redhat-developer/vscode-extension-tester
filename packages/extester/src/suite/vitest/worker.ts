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

import sanitize from 'sanitize-filename';
import { VSBrowser, VSBrowserSessionInfo } from '../../browser';

/**
 * Code ExTester runs inside Vitest workers, loaded by the `setup.mjs` setup file.
 * It is plain CommonJS, so it shares the `VSBrowser` and page-object modules with test files
 * that import `vscode-extension-tester` (ExTester's packages are externalized, see the adapter).
 */

/** Key under which the adapter provides the WebDriver session to the workers */
export const SESSION_KEY = 'extester:session';

/**
 * Drive the VS Code window of the ExTester process from this worker
 * @param info session provided by the adapter
 */
export function attachWorker(info: VSBrowserSessionInfo | undefined): VSBrowser {
	if (!info) {
		throw new Error(
			'No VS Code session was provided to this Vitest worker. Run the tests with `extest run-tests --test_runner vitest`, not with `vitest` directly.',
		);
	}
	return VSBrowser.attach(info);
}

/**
 * Screenshot file name of a test, matching the name Mocha runs use (`fullTitle()`: suite and test titles joined by spaces)
 * @param fullTestName Vitest full test name, levels separated by ` > `
 */
export function screenshotName(fullTestName: string): string {
	return sanitize(fullTestName.split(' > ').join(' '));
}

/**
 * Take the screenshot of a failed test, never failing the run itself
 * @param fullTestName Vitest full test name
 */
export async function screenshotFailedTest(fullTestName: string): Promise<void> {
	try {
		await VSBrowser.instance.takeScreenshot(screenshotName(fullTestName));
	} catch (err) {
		console.log('Screenshot capture failed.', err);
	}
}
