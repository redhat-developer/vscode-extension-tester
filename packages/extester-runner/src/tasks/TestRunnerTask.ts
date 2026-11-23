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
import { randomUUID } from 'node:crypto';
import { ShellExecution, Task, TaskDefinition, tasks, TaskScope, WorkspaceFolder } from 'vscode';
import { Logger } from '../logger/logger';

/**
 * How a test run ended.
 *
 * - `passed`: the test process exited with code 0.
 * - `failed`: the test process exited with a non-zero code.
 * - `stopped`: the run was stopped by the user before it ended.
 * - `unknown`: the task ended without reporting an exit code.
 */
export type RunOutcome = 'passed' | 'failed' | 'stopped' | 'unknown';

/**
 * Result of a finished test run.
 */
export interface RunResult {
	outcome: RunOutcome;
	exitCode?: number;
}

/**
 * Abstract base class for test execution tasks.
 *
 * This class extends VS Code's `Task` and provides a standardized way to execute
 * test-related tasks using a shell command. It waits for the started execution to end
 * and reports how it ended.
 *
 * Subclasses should implement specific test execution logic while inheriting
 * the task execution and tracking behavior.
 */
export abstract class TestRunner extends Task {
	protected label: string;
	protected logger: Logger;
	private readonly runId: string;
	private taskExecution: vscode.TaskExecution | undefined;
	private stopRequested = false;

	/**
	 * Creates an instance of the `TestRunner` task.
	 *
	 * @param {WorkspaceFolder | TaskScope.Workspace} scope - The scope in which the task runs.
	 * @param {string} label - The name of the task.
	 * @param {ShellExecution} shellExecution - The shell command to execute for the task.
	 * @param {Logger} logger - Logger instance for tracking task execution.
	 */
	constructor(scope: WorkspaceFolder | TaskScope.Workspace, label: string, shellExecution: ShellExecution, logger: Logger) {
		// A unique id in the definition identifies this run in task events, even when another run has the same name.
		const runId = randomUUID();
		const taskDefinition: TaskDefinition = {
			label: label,
			type: 'shell',
			runId,
		};

		super(taskDefinition, scope, label, 'extester-runner', shellExecution);
		this.runId = runId;
		this.label = label;
		this.logger = logger;
		this.presentationOptions.echo = false; // hide command in terminal
		this.presentationOptions.clear = true; // clean terminal output before each execution
	}

	/**
	 * The name of the run, shown in the status bar and notifications.
	 */
	public get runLabel(): string {
		return this.label;
	}

	/**
	 * Executes the test task asynchronously.
	 * This method starts the task execution and waits for its completion before returning.
	 *
	 * @returns {Promise<RunResult>} Resolves with how the run ended once the task has completed.
	 */
	public async execute(): Promise<RunResult> {
		this.logger.info(`Starting test execution: ${this.label}`);
		let exitCode: number | undefined;
		let resolveEnded: (() => void) | undefined;
		const ended = new Promise<void>((resolve) => (resolveEnded = resolve));
		// Subscribe before starting the task, so a quickly finishing task cannot end unnoticed.
		// Events are matched by the run id, not by task name, so two runs with the same name cannot be confused.
		const processListener = tasks.onDidEndTaskProcess((e) => {
			if (this.isThisRun(e.execution)) {
				exitCode = e.exitCode;
			}
		});
		const endListener = tasks.onDidEndTask((e) => {
			if (this.isThisRun(e.execution)) {
				this.logger.debug(`Task finished: ${this.label}`);
				resolveEnded?.();
			}
		});
		try {
			this.taskExecution = await tasks.executeTask(this);
			if (this.stopRequested) {
				// Stop was requested while the task was starting.
				this.taskExecution.terminate();
			}
			await ended;
			const result = this.toResult(exitCode);
			const exitCodeText = exitCode === undefined ? '' : ', exit code ' + exitCode;
			this.logger.info(`Test execution completed: ${this.label} (${result.outcome}${exitCodeText})`);
			return result;
		} catch (error) {
			this.logger.error(`Test execution failed: ${this.label} - ${error}`);
			return { outcome: 'unknown' };
		} finally {
			processListener.dispose();
			endListener.dispose();
			this.taskExecution = undefined;
			this.logger.debug('Refreshing all trees after test run.');
			void vscode.commands.executeCommand('extester-runner.refreshTests');
			void vscode.commands.executeCommand('extester-runner.refreshLogs');
			void vscode.commands.executeCommand('extester-runner.refreshScreenshots');
		}
	}

	/**
	 * Stops the running task, if it was started.
	 */
	public stop(): void {
		this.stopRequested = true;
		if (this.taskExecution) {
			this.logger.info(`Stopping test execution: ${this.label}`);
			this.taskExecution.terminate();
		}
	}

	/**
	 * Whether a task event belongs to this run.
	 *
	 * @param {vscode.TaskExecution} execution - The execution reported by a task event.
	 * @returns {boolean} `true` when the execution runs this task.
	 */
	private isThisRun(execution: vscode.TaskExecution): boolean {
		return execution === this.taskExecution || execution.task.definition.runId === this.runId;
	}

	/**
	 * Converts the exit code of the test process to a run result.
	 *
	 * @param {number | undefined} exitCode - Exit code reported by the task process.
	 * @returns {RunResult} How the run ended.
	 */
	private toResult(exitCode: number | undefined): RunResult {
		if (this.stopRequested) {
			return { outcome: 'stopped', exitCode };
		}
		if (exitCode === undefined) {
			return { outcome: 'unknown' };
		}
		return { outcome: exitCode === 0 ? 'passed' : 'failed', exitCode };
	}
}
