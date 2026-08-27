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

import * as path from 'path';
import { pathToFileURL } from 'url';
import { expect } from 'chai';
import { VSBrowser } from 'vscode-extension-tester';

// Resources passed to `extest run-tests --open_resource` are opened with the
// initial VS Code launch (--folder-uri / --file-uri) instead of a post-launch
// second-instance CLI call, which triggers webview resource corruption on
// VS Code >= 1.123.0 (microsoft/vscode#330243, issue #2454).
describe('VSBrowser.resourceToLaunchArg', () => {
	const resources = path.resolve(__dirname, '..', '..', 'resources');

	it('maps a directory to --folder-uri', () => {
		const arg = VSBrowser.resourceToLaunchArg(path.join(resources, 'test-folder'));
		expect(arg).to.match(/^--folder-uri=file:\/\//);
		expect(arg).to.have.string('test-folder');
	});

	it('maps a file to --file-uri', () => {
		const arg = VSBrowser.resourceToLaunchArg(path.join(resources, 'test-file.ts'));
		expect(arg).to.match(/^--file-uri=file:\/\//);
		expect(arg).to.have.string('test-file.ts');
	});

	it('percent-encodes special characters so the URI round-trips', () => {
		const target = path.join(resources, 'folder with speci@l chars');
		const arg = VSBrowser.resourceToLaunchArg(target);
		expect(arg).to.have.string('folder%20with%20speci@l%20chars');
		expect(arg.split('=').slice(1).join('=')).to.equal(pathToFileURL(path.resolve(target)).href);
	});

	it('resolves relative paths against the working directory', () => {
		const arg = VSBrowser.resourceToLaunchArg('.');
		expect(arg).to.equal(`--folder-uri=${pathToFileURL(path.resolve('.')).href}`);
	});
});
