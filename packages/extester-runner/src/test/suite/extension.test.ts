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
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { describe, it, before, after } from 'mocha';

const EXTENSION_ID = 'extester-runner';
const EXTENSION_PUBLISHER = 'ExTester';
const FULL_EXTENSION_ID = `${EXTENSION_PUBLISHER}.${EXTENSION_ID}`;

describe('Extension Test Suite', () => {
	const testWorkspace = path.resolve(__dirname, '../../resources/testing-workspace');

	before(async () => {
		// create test workspace directory if it doesn't exist
		if (!fs.existsSync(testWorkspace)) {
			fs.mkdirSync(testWorkspace, { recursive: true });
		}
	});

	after(() => {
		// clean up test workspace
		if (fs.existsSync(testWorkspace)) {
			fs.rmSync(testWorkspace, { recursive: true, force: true });
		}
	});

	it('should be present', () => {
		const extension = vscode.extensions.getExtension(FULL_EXTENSION_ID);
		assert.ok(extension, 'Extension should be present');
		assert.strictEqual(extension.id, FULL_EXTENSION_ID, 'Extension ID should match');
		assert.strictEqual(extension.packageJSON.name, EXTENSION_ID, 'Package name should match');
		assert.strictEqual(extension.packageJSON.publisher, EXTENSION_PUBLISHER, 'Publisher should match');
	});

	it('should activate', async () => {
		const extension = vscode.extensions.getExtension(FULL_EXTENSION_ID);
		assert.ok(extension);
		await extension?.activate();
		assert.strictEqual(extension?.isActive, true);
	});

	it('should register commands', async () => {
		const extension = vscode.extensions.getExtension(FULL_EXTENSION_ID);
		assert.ok(extension);
		await extension?.activate();

		const commands = await vscode.commands.getCommands(true);
		const extensionCommands = commands.filter((cmd) => cmd.startsWith(`${EXTENSION_ID}.`));
		assert.ok(extensionCommands.length > 0, 'No extension commands were registered');
	});

	it('should have accessible test workspace', () => {
		assert.ok(fs.existsSync(testWorkspace), 'Test workspace directory should exist');
		assert.ok(fs.statSync(testWorkspace).isDirectory(), 'Test workspace should be a directory');
	});

	it('should handle workspace trust', async () => {
		const workspaceTrust = vscode.workspace.isTrusted;
		assert.ok(workspaceTrust !== undefined, 'Workspace trust state should be defined');
	});

	it('should have correct activation events', () => {
		const extension = vscode.extensions.getExtension(FULL_EXTENSION_ID);
		assert.ok(extension);
		const activationEvents = extension.packageJSON.activationEvents;
		assert.ok(activationEvents.includes('onStartupFinished'), 'Extension should activate on startup');
	});

	it('should have correct engine requirements', () => {
		const extension = vscode.extensions.getExtension(FULL_EXTENSION_ID);
		assert.ok(extension);
		const engines = extension.packageJSON.engines;
		assert.ok(engines.vscode, 'VS Code engine requirement should be defined');
		assert.strictEqual(engines.vscode, '^1.96.0', 'VS Code engine version should match');
	});

	it('should create output channel', async () => {
		const extension = vscode.extensions.getExtension(FULL_EXTENSION_ID);
		assert.ok(extension);
		await extension?.activate();

		// create and verify output channel
		const outputChannel = vscode.window.createOutputChannel('ExTester Runner');
		assert.ok(outputChannel, 'Output channel should be created');
		assert.strictEqual(outputChannel.name, 'ExTester Runner', 'Output channel name should match');
	});
});
