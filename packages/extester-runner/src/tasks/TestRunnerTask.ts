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

/** How long a debug run waits for another process of its command before it ends, in milliseconds. */
const DEBUG_END_DELAY = 2000;

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
	/**
	 * Why the tests did not start, when a step before them failed, for example the pre-run task.
	 */
	failedStep?: string;
}

/**
 * Abstract base class for test execution tasks.
 *
 * This class extends VS Code's `Task` and provides a standardized way to execute
 * test-related tasks using a shell command. It runs the configured pre-run task first, waits
 * for the started execution to end and reports how it ended.
 *
 * Subclasses should implement specific test execution logic while inheriting
 * the task execution and tracking behavior.
 */
export abstract class TestRunner extends Task {
	protected label: string;
	protected logger: Logger;
	private readonly runId: string;
	private readonly preRunTask: string | undefined;
	private taskExecution: vscode.TaskExecution | undefined;
	private debugging = false;
	private debugSession: vscode.DebugSession | undefined;
	private stopRequested = false;

	/**
	 * Creates an instance of the `TestRunner` task.
	 *
	 * @param {WorkspaceFolder | TaskScope.Workspace} scope - The scope in which the task runs.
	 * @param {string} label - The name of the task.
	 * @param {ShellExecution} shellExecution - The shell command to execute for the task.
	 * @param {Logger} logger - Logger instance for tracking task execution.
	 * @param {string} [preRunTask] - Name of a VS Code task to run before the tests, such as `npm: compile`.
	 */
	constructor(scope: WorkspaceFolder | TaskScope.Workspace, label: string, shellExecution: ShellExecution, logger: Logger, preRunTask?: string) {
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
		this.preRunTask = preRunTask?.trim() || undefined;
		this.presentationOptions.echo = false; // hide command in terminal
		this.presentationOptions.clear = true; // clean terminal output before each execution
		// The Testing view shows the results and output: keep the task terminal in the background.
		this.presentationOptions.reveal = vscode.TaskRevealKind.Never;
		this.presentationOptions.focus = false;
	}

	/**
	 * The name of the run, shown in the task terminal and the log.
	 */
	public get runLabel(): string {
		return this.label;
	}

	/**
	 * Executes the test task asynchronously.
	 * This method runs the pre-run task, if one is configured, then starts the test task and
	 * waits for its completion before returning.
	 *
	 * @returns {Promise<RunResult>} Resolves with how the run ended once the task has completed.
	 */
	public async execute(): Promise<RunResult> {
		try {
			const preRunResult = await this.runPreRunTask();
			if (preRunResult) {
				return preRunResult;
			}
			this.logger.info(`Starting test execution: ${this.label}`);
			const exitCode = this.debugging
				? await this.debugAndWait()
				: await this.executeAndWait(this, (execution) => execution.task.definition.runId === this.runId);
			const result = this.toResult(exitCode);
			const exitCodeText = exitCode === undefined ? '' : ', exit code ' + exitCode;
			this.logger.info(`Test execution completed: ${this.label} (${result.outcome}${exitCodeText})`);
			return result;
		} catch (error) {
			this.logger.error(`Test execution failed: ${this.label} - ${error}`);
			return { outcome: 'unknown' };
		} finally {
			this.logger.debug('Refreshing the Screenshots and Logs views after the test run.');
			void vscode.commands.executeCommand('extester-runner.refreshLogs');
			void vscode.commands.executeCommand('extester-runner.refreshScreenshots');
		}
	}

	/**
	 * Adds environment variables to the test process. Call it before `execute()`.
	 *
	 * @param {Record<string, string>} env - The variables to add; they replace configured variables with the same name.
	 */
	public addEnvironment(env: Record<string, string>): void {
		const execution = this.execution as ShellExecution;
		execution.options = { ...execution.options, env: { ...execution.options?.env, ...env } };
	}

	/**
	 * Reads an environment variable that the test process gets from the task, such as one from the `extesterRunner.env` setting.
	 *
	 * @param {string} name - The variable name.
	 * @returns {string | undefined} The value, or `undefined` when the task does not set the variable.
	 */
	public getEnvironment(name: string): string | undefined {
		return (this.execution as ShellExecution).options?.env?.[name];
	}

	/**
	 * Runs the tests with the JavaScript debugger instead of as a task, so breakpoints in the tests
	 * stop them. Mocha's timeouts are turned off for the run. Call it before `execute()`.
	 */
	public useDebugger(): void {
		this.debugging = true;
		this.addEnvironment({ EXTESTER_RUNNER_NO_TIMEOUT: 'true' });
	}

	/**
	 * Stops the running task or debug session, if it was started.
	 */
	public stop(): void {
		this.stopRequested = true;
		if (this.taskExecution) {
			this.logger.info(`Stopping test execution: ${this.label}`);
			this.taskExecution.terminate();
		}
		if (this.debugSession) {
			this.logger.info(`Stopping test debugging: ${this.label}`);
			void vscode.debug.stopDebugging(this.debugSession);
		}
	}

	/**
	 * Runs the configured pre-run task, such as a build, and waits for it to end.
	 *
	 * @returns {Promise<RunResult | undefined>} `undefined` when the tests can start, otherwise how the run ended.
	 */
	private async runPreRunTask(): Promise<RunResult | undefined> {
		if (!this.preRunTask) {
			return undefined;
		}
		const name = this.preRunTask;
		const preRunTask = await this.findTask(name);
		if (!preRunTask) {
			return { outcome: 'failed', failedStep: `pre-run task "${name}" was not found` };
		}
		if (preRunTask.isBackground) {
			// A background task, such as a watch task, does not end, so the tests would never start.
			return { outcome: 'failed', failedStep: `pre-run task "${name}" is a background task that does not end` };
		}
		this.logger.info(`Running pre-run task: ${name}`);
		const exitCode = await this.executeAndWait(
			preRunTask,
			(execution) => execution.task.name === preRunTask.name && execution.task.source === preRunTask.source,
		);
		this.logger.info(`Pre-run task ended: ${name} (exit code ${exitCode ?? 'unknown'})`);
		if (this.stopRequested) {
			return { outcome: 'stopped', exitCode };
		}
		if (exitCode !== undefined && exitCode !== 0) {
			return { outcome: 'failed', exitCode, failedStep: `pre-run task "${name}" failed (exit code ${exitCode})` };
		}
		return undefined;
	}

	/**
	 * Finds a VS Code task by the name it has in the "Run Task" list.
	 *
	 * @param {string} name - The task name, either alone (`compile`) or with its source (`npm: compile`).
	 * @returns {Promise<vscode.Task | undefined>} The task, or `undefined` when no task has this name.
	 */
	private async findTask(name: string): Promise<vscode.Task | undefined> {
		const available = await tasks.fetchTasks();
		const matches = available.filter((task) => task.name === name || task.source + ': ' + task.name === name);
		// In a multi-root workspace, prefer the task of the workspace folder that runs the tests.
		const ownFolder = folderUri(this.scope);
		return matches.find((task) => ownFolder !== undefined && folderUri(task.scope) === ownFolder) ?? matches[0];
	}

	/**
	 * Starts a task and waits for it to end. The task can be stopped with `stop()` while it runs.
	 *
	 * @param {vscode.Task} task - The task to start.
	 * @param {(execution: vscode.TaskExecution) => boolean} isSameTask - Whether a task event belongs to the started task.
	 * @returns {Promise<number | undefined>} The exit code of the task process, if it reported one.
	 */
	private async executeAndWait(task: vscode.Task, isSameTask: (execution: vscode.TaskExecution) => boolean): Promise<number | undefined> {
		let exitCode: number | undefined;
		let resolveEnded: (() => void) | undefined;
		const ended = new Promise<void>((resolve) => (resolveEnded = resolve));
		const isThisExecution = (execution: vscode.TaskExecution) => execution === this.taskExecution || isSameTask(execution);
		// Subscribe before starting the task, so a quickly finishing task cannot end unnoticed.
		const processListener = tasks.onDidEndTaskProcess((e) => {
			if (isThisExecution(e.execution)) {
				exitCode = e.exitCode;
			}
		});
		const endListener = tasks.onDidEndTask((e) => {
			if (isThisExecution(e.execution)) {
				this.logger.debug(`Task finished: ${e.execution.task.name}`);
				resolveEnded?.();
			}
		});
		try {
			this.taskExecution = await tasks.executeTask(task);
			if (this.stopRequested) {
				// Stop was requested while the task was starting.
				this.taskExecution.terminate();
			}
			await ended;
			return exitCode;
		} finally {
			processListener.dispose();
			endListener.dispose();
			this.taskExecution = undefined;
		}
	}

	/**
	 * Runs the command of the task in a JavaScript Debug Terminal and waits for the debug session to end.
	 * The debugger attaches to every Node.js process the command starts, including the one that runs Mocha.
	 *
	 * @returns {Promise<number | undefined>} Always `undefined`: a debug session reports no exit code.
	 */
	private async debugAndWait(): Promise<number | undefined> {
		const execution = this.execution as ShellExecution;
		const name = `ExTester: ${this.label} (${this.runId.slice(0, 8)})`;
		let resolveEnded: (() => void) | undefined;
		const ended = new Promise<void>((resolve) => (resolveEnded = resolve));
		// The session of a JavaScript Debug Terminal lasts as long as its shell, which stays open after the
		// command. The Node.js processes of the command are its child sessions: once they all ended, the
		// command is done, so the session is stopped. The terminal and its output stay.
		const processes = new Set<vscode.DebugSession>();
		let stopTimer: NodeJS.Timeout | undefined;
		const isOwnProcess = (session: vscode.DebugSession) => {
			for (let parent = session.parentSession; parent; parent = parent.parentSession) {
				if (parent === this.debugSession) {
					return true;
				}
			}
			return false;
		};
		const startListener = vscode.debug.onDidStartDebugSession((session) => {
			if (session.name === name) {
				this.debugSession = session;
			} else if (isOwnProcess(session)) {
				processes.add(session);
				clearTimeout(stopTimer);
			}
		});
		const endListener = vscode.debug.onDidTerminateDebugSession((session) => {
			if (session.name === name) {
				resolveEnded?.();
			} else if (processes.delete(session) && processes.size === 0 && this.debugSession) {
				// Wait a moment: a command such as `npm run build && extest ...` starts its next process right away.
				const debugSession = this.debugSession;
				stopTimer = setTimeout(() => void vscode.debug.stopDebugging(debugSession), DEBUG_END_DELAY);
			}
		});
		try {
			const configuration: vscode.DebugConfiguration = {
				type: 'node-terminal',
				request: 'launch',
				name,
				command: commandLine(execution),
				cwd: execution.options?.cwd,
				env: execution.options?.env,
			};
			const folder = typeof this.scope === 'object' ? this.scope : undefined;
			if (!(await vscode.debug.startDebugging(folder, configuration))) {
				throw new Error('the JavaScript debugger did not start');
			}
			if (this.stopRequested && this.debugSession) {
				// Stop was requested while the debugger was starting.
				void vscode.debug.stopDebugging(this.debugSession);
			}
			await ended;
			return undefined;
		} finally {
			clearTimeout(stopTimer);
			startListener.dispose();
			endListener.dispose();
			this.debugSession = undefined;
		}
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

/**
 * The URI of the workspace folder a task belongs to.
 *
 * @param {Task['scope']} scope - The scope of a task.
 * @returns {string | undefined} The folder URI, or `undefined` when the task does not belong to one folder.
 */
function folderUri(scope: Task['scope']): string | undefined {
	return typeof scope === 'object' ? scope.uri.toString() : undefined;
}

/**
 * The command line of a shell execution, with quoted arguments in quotes as the task shell gets them.
 *
 * @param {ShellExecution} execution - The shell execution of a test task.
 * @returns {string} The command line.
 */
function commandLine(execution: ShellExecution): string {
	if (execution.commandLine) {
		return execution.commandLine;
	}
	// cmd.exe does not treat single quotes as quotes; PowerShell and cmd.exe both accept double quotes.
	const quote = process.platform === 'win32' ? '"' : "'";
	const toText = (part: string | vscode.ShellQuotedString | undefined) =>
		typeof part === 'string' || part === undefined ? (part ?? '') : `${quote}${part.value}${quote}`;
	return [execution.command, ...(execution.args ?? [])].map(toText).join(' ');
}
