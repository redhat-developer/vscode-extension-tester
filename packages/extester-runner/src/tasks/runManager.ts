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

import * as vscode from 'vscode';
import { Logger } from '../logger/logger';
import { parseScreen, VirtualDisplay } from '../utils/virtualDisplay';
import { RunResult, TestRunner } from './TestRunnerTask';

/**
 * Runs test tasks one at a time.
 *
 * ExTester starts one VS Code instance per run and the runs share its resources, so a run that
 * starts while another one is in progress is refused. The Testing view shows the progress and the
 * results, and stops runs through {@link TestRunManager.stop}.
 */
export class TestRunManager implements vscode.Disposable {
	private current: TestRunner | undefined;
	private groupRunning = false;
	private stopRequested = false;
	private platformWarningShown = false;

	/**
	 * Creates an instance of the `TestRunManager`.
	 *
	 * @param {Logger} logger - Logger instance for tracking runs.
	 */
	constructor(
		private readonly logger: Logger,
		private readonly virtualDisplay = new VirtualDisplay(),
	) {}

	/**
	 * Whether a test run is in progress.
	 */
	get isRunning(): boolean {
		return this.groupRunning || this.current !== undefined;
	}

	/**
	 * Whether the user stopped the current group of runs (for example all tests over several workspace folders).
	 */
	get wasStopped(): boolean {
		return this.stopRequested;
	}

	/**
	 * Starts a group of runs, for example one run request of the Testing view.
	 * Refuses to start when a run is already in progress.
	 *
	 * @param {() => Promise<void>} runGroup - Starts the runs of the group.
	 * @returns {Promise<void>} Resolves when all runs of the group have ended.
	 */
	async startGroup(runGroup: () => Promise<void>): Promise<void> {
		if (this.isRunning) {
			const running = this.current ? `ExTester is already running ${this.current.runLabel}.` : 'ExTester is already running tests.';
			const choice = await vscode.window.showInformationMessage(running, 'Stop');
			if (choice === 'Stop') {
				this.stop();
			}
			return;
		}
		// The whole group holds the lock, so a request between two of its runs cannot start or reset the stop flag.
		this.groupRunning = true;
		this.stopRequested = false;
		try {
			await runGroup();
		} finally {
			this.groupRunning = false;
		}
	}

	/**
	 * Executes one test task.
	 *
	 * @param {TestRunner} task - The task to execute.
	 * @returns {Promise<RunResult>} How the run ended.
	 */
	async run(task: TestRunner): Promise<RunResult> {
		if (this.current) {
			throw new Error(`ExTester is already running ${this.current.runLabel}.`);
		}
		this.current = task;
		try {
			const displayError = await this.prepareDisplay(task);
			if (displayError) {
				return { outcome: 'failed', failedStep: displayError };
			}
			const result = await task.execute();
			if (result.outcome === 'stopped') {
				this.stopRequested = true;
				this.logger.info(`Test run stopped: ${task.runLabel}`);
			}
			return result;
		} finally {
			this.current = undefined;
		}
	}

	/**
	 * Points the run at the virtual display when the `virtualDisplay` setting is on.
	 *
	 * @param {TestRunner} task - The task to run.
	 * @returns {Promise<string | undefined>} Why the run cannot start, or `undefined` when it can.
	 */
	private async prepareDisplay(task: TestRunner): Promise<string | undefined> {
		const scope = typeof task.scope === 'object' ? task.scope.uri : undefined;
		const settings = vscode.workspace.getConfiguration('extesterRunner', scope);
		if (!settings.get<boolean>('virtualDisplay', false)) {
			// Do not keep Xvfb running once the setting is turned off.
			this.virtualDisplay.dispose();
			return undefined;
		}
		if (process.platform !== 'linux') {
			this.logger.info('The virtualDisplay setting works on Linux only; the tests run on the screen.');
			if (!this.platformWarningShown) {
				this.platformWarningShown = true;
				void vscode.window.showWarningMessage(
					'ExTester Runner: the virtual display (Xvfb) is available on Linux only, so the tests run on your screen. Try the experimental hiddenWindow setting instead.',
				);
			}
			return undefined;
		}
		const configuredDisplay = task.getEnvironment('DISPLAY');
		if (configuredDisplay) {
			// A display set in `env` wins, as EXTESTER_HIDDEN_WINDOW in `env` wins over hiddenWindow.
			this.logger.info(`Running the tests on DISPLAY=${configuredDisplay} from the env setting instead of a virtual display.`);
			task.useDisplay(configuredDisplay);
			return undefined;
		}
		try {
			const access = await this.virtualDisplay.acquire(parseScreen(settings.get<string>('virtualDisplayScreen')));
			this.logger.info(`Running the tests on the virtual display ${access.display}.`);
			task.useDisplay(access.display, access.xauthority);
			return undefined;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.logger.error(`The virtual display did not start: ${message}`);
			return `the virtual display did not start: ${message}`;
		}
	}

	/**
	 * Stops the run in progress, if any.
	 */
	stop(): void {
		this.stopRequested = true;
		this.current?.stop();
	}

	dispose(): void {
		this.stop();
		this.virtualDisplay.dispose();
	}
}
