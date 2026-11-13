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
	const testWorkspace = path.resolve(__dirname, '../../', 'src/test/resources/testing-workspace');
	// Per-run scratch directory (kept short: VS Code puts IPC sockets in the user data dir and macOS
	// limits socket paths to ~104 chars) for the user data and the workspace file, so state from
	// one run (e.g. workspace folders added by a test) can never leak into the next one.
	const runDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ert-'));
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');
		console.log(`extensionDevelopmentPath = ${extensionDevelopmentPath}`);

		console.log(`testWorkspace = ${testWorkspace}`);
		fs.rmSync(testWorkspace, { recursive: true, force: true });
		fs.mkdirSync(testWorkspace);

		// Open a multi-root workspace from the start: tests that add or remove further workspace
		// folders then only edit this file instead of turning a single-folder window into an
		// untitled workspace, which VS Code does not reliably allow from an extension test.
		const workspaceFile = path.join(runDirectory, 'testing.code-workspace');
		fs.writeFileSync(workspaceFile, JSON.stringify({ folders: [{ path: testWorkspace }], settings: {} }, undefined, '\t'));

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
			launchArgs: [workspaceFile, '--disable-workspace-trust', '--user-data-dir', path.join(runDirectory, 'ud')],
		});
	} catch (err) {
		console.error(err);
		console.error('Failed to run tests');
		process.exitCode = 1;
	} finally {
		fs.rmSync(testWorkspace, { recursive: true, force: true });
		fs.rmSync(runDirectory, { recursive: true, force: true });
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
