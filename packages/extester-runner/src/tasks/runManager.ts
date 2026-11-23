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
import { RunResult, TestRunner } from './TestRunnerTask';

/**
 * Context key that is `true` while a test run is in progress.
 * Menus use it to swap the run buttons for a stop button.
 */
export const RUNNING_CONTEXT_KEY = 'extesterRunner.isRunning';

/**
 * Context key that is `true` once a run was started, so "Rerun Last Run" can be offered.
 */
export const HAS_LAST_RUN_CONTEXT_KEY = 'extesterRunner.hasLastRun';

/**
 * Actions offered by the notification shown when a run ends.
 */
const SHOW_LOGS = 'Show Logs';
const SHOW_SCREENSHOTS = 'Show Screenshots';
const RERUN = 'Rerun';

/**
 * Runs test tasks one at a time and shows their state.
 *
 * The manager:
 * - refuses to start a run while another one is in progress,
 * - shows the running test in the status bar, with a click to stop it,
 * - keeps the `extesterRunner.isRunning` context key up to date,
 * - remembers the last run so it can be started again,
 * - shows a notification with follow-up actions when a run ends.
 */
export class TestRunManager implements vscode.Disposable {
	private readonly statusBarItem: vscode.StatusBarItem;
	private current: TestRunner | undefined;
	private lastRun: (() => Promise<void>) | undefined;
	private stopRequested = false;

	/**
	 * Creates an instance of the `TestRunManager`.
	 *
	 * @param {Logger} logger - Logger instance for tracking runs.
	 */
	constructor(private readonly logger: Logger) {
		this.statusBarItem = vscode.window.createStatusBarItem('extesterRunner.runStatus', vscode.StatusBarAlignment.Left);
		this.statusBarItem.name = 'ExTester Runner';
		this.statusBarItem.command = 'extester-runner.stopRun';
		void vscode.commands.executeCommand('setContext', RUNNING_CONTEXT_KEY, false);
		void vscode.commands.executeCommand('setContext', HAS_LAST_RUN_CONTEXT_KEY, false);
	}

	/**
	 * Whether a test run is in progress.
	 */
	get isRunning(): boolean {
		return this.current !== undefined;
	}

	/**
	 * Whether the user stopped the current group of runs (for example Run All over several workspace folders).
	 */
	get wasStopped(): boolean {
		return this.stopRequested;
	}

	/**
	 * Starts a group of runs, for example one command. Remembers it as the last run, so it can be rerun.
	 * Refuses to start when a run is already in progress.
	 *
	 * @param {() => Promise<void>} runGroup - Starts the runs of the command.
	 * @returns {Promise<void>} Resolves when all runs of the group have ended.
	 */
	async startGroup(runGroup: () => Promise<void>): Promise<void> {
		if (this.isRunning) {
			const choice = await vscode.window.showInformationMessage(`ExTester Runner is already running ${this.current?.runLabel}.`, 'Stop');
			if (choice === 'Stop') {
				this.stop();
			}
			return;
		}
		this.stopRequested = false;
		this.lastRun = runGroup;
		void vscode.commands.executeCommand('setContext', HAS_LAST_RUN_CONTEXT_KEY, true);
		await runGroup();
	}

	/**
	 * Executes one test task, showing its progress in the status bar and its result in a notification.
	 *
	 * @param {TestRunner} task - The task to execute.
	 * @returns {Promise<RunResult>} How the run ended.
	 */
	async run(task: TestRunner): Promise<RunResult> {
		if (this.current) {
			throw new Error(`ExTester Runner is already running ${this.current.runLabel}.`);
		}
		this.setCurrent(task);
		try {
			const result = await task.execute();
			if (result.outcome === 'stopped') {
				this.stopRequested = true;
			}
			this.notify(task.runLabel, result);
			return result;
		} finally {
			this.setCurrent(undefined);
		}
	}

	/**
	 * Stops the run in progress, if any.
	 */
	stop(): void {
		this.stopRequested = true;
		if (!this.current) {
			return;
		}
		this.current.stop();
	}

	/**
	 * Starts the last run again, with the current settings.
	 */
	async rerunLast(): Promise<void> {
		if (!this.lastRun) {
			void vscode.window.showInformationMessage('ExTester Runner has not run any tests yet.');
			return;
		}
		await this.startGroup(this.lastRun);
	}

	dispose(): void {
		this.statusBarItem.dispose();
	}

	/**
	 * Updates the current run and everything that shows it.
	 *
	 * @param {TestRunner | undefined} task - The task that runs now, or `undefined` when idle.
	 */
	private setCurrent(task: TestRunner | undefined): void {
		this.current = task;
		void vscode.commands.executeCommand('setContext', RUNNING_CONTEXT_KEY, task !== undefined);
		if (task) {
			this.statusBarItem.text = `$(sync~spin) ExTester: ${task.runLabel}`;
			this.statusBarItem.tooltip = `Running ${task.runLabel}. Click to stop.`;
			this.statusBarItem.show();
		} else {
			this.statusBarItem.hide();
		}
	}

	/**
	 * Shows how a run ended, with actions to inspect the results or run again.
	 *
	 * @param {string} label - Name of the run.
	 * @param {RunResult} result - How the run ended.
	 */
	private notify(label: string, result: RunResult): void {
		let notification: Thenable<string | undefined>;
		switch (result.outcome) {
			case 'passed':
				notification = vscode.window.showInformationMessage(`ExTester: ${label} passed.`, RERUN);
				break;
			case 'failed':
				notification = vscode.window.showWarningMessage(
					`ExTester: ${label} failed (exit code ${result.exitCode}).`,
					SHOW_SCREENSHOTS,
					SHOW_LOGS,
					RERUN,
				);
				break;
			case 'stopped':
				this.logger.info(`Test run stopped: ${label}`);
				return;
			default:
				notification = vscode.window.showInformationMessage(`ExTester: ${label} finished.`, SHOW_LOGS, RERUN);
		}
		void notification.then((choice) => this.onNotificationAction(choice));
	}

	/**
	 * Handles an action picked in the run notification.
	 *
	 * @param {string | undefined} choice - The picked action, if any.
	 */
	private async onNotificationAction(choice: string | undefined): Promise<void> {
		switch (choice) {
			case SHOW_LOGS:
				await vscode.commands.executeCommand('extesterResourcesLogsView.focus');
				break;
			case SHOW_SCREENSHOTS:
				await vscode.commands.executeCommand('extesterResourcesScreenshotsView.focus');
				break;
			case RERUN:
				await this.rerunLast();
				break;
		}
	}
}
