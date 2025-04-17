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
import * as fs from 'fs';
import * as os from 'os';
import { downloadAndUnzipVSCode, runTests } from '@vscode/test-electron';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');
		console.log(`extensionDevelopmentPath = ${extensionDevelopmentPath}`);

		const testWorkspace = path.resolve(__dirname, '../../', 'src/test/resources/testing-workspace');
		console.log(`testWorkspace = ${testWorkspace}`);
		fs.mkdirSync(testWorkspace);

		// The path to the extension test runner script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');
		console.log(`extensionTestsPath = ${extensionTestsPath}`);

		const vscodeVersion = computeVSCodeVersionToPlayTestWith();
		console.log(`vscodeVersion = ${vscodeVersion}`);

		const vscodeExecutablePath: string = await downloadAndUnzipVSCode(vscodeVersion);
		console.log(`vscodeExecutablePath = ${vscodeExecutablePath}`);

		await runTests({
			vscodeExecutablePath,
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [testWorkspace, '--disable-workspace-trust', '--user-data-dir', `${os.tmpdir()}/.vscode-test`],
		});

		fs.rmSync(testWorkspace, { recursive: true, force: true });
	} catch (err) {
		console.error(err);
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main().catch((error) => {
	console.error('Unhandled promise rejection in main: ', error);
});

function computeVSCodeVersionToPlayTestWith() {
	const envVersion = process.env.CODE_VERSION;
	if (envVersion === undefined || envVersion === 'max') {
		return 'stable';
	} else if (envVersion === 'latest') {
		return 'insiders';
	}
	return envVersion;
}
