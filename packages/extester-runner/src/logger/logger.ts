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

/**
 * Logger utility for handling log messages in the VS Code extension.
 *
 * This class provides methods for logging messages with different severity levels
 * (info, debug, and error) to the VS Code output channel.
 */
import * as vscode from 'vscode';

export class Logger {
	private readonly outputChannel: vscode.OutputChannel;

	/**
	 * Creates an instance of the Logger.
	 *
	 * @param {vscode.OutputChannel} outputChannel - The output channel where log messages will be written.
	 */
	constructor(outputChannel: vscode.OutputChannel) {
		this.outputChannel = outputChannel;
	}

	/**
	 * Logs an informational message.
	 *
	 * @param {string} message - The message to log.
	 */
	info(message: string) {
		this.outputChannel.appendLine(`[INFO] ${message}`);
	}

	/**
	 * Logs a debug message.
	 *
	 * @param {string} message - The debug message to log.
	 */
	debug(message: string) {
		this.outputChannel.appendLine(`[DEBUG] ${message}`);
	}

	/**
	 * Logs an error message.
	 *
	 * @param {string} message - The error message to log.
	 */
	error(message: string) {
		this.outputChannel.appendLine(`[ERROR] ${message}`);
	}
}

/**
 * Creates a new instance of the Logger.
 *
 * This function initializes a `Logger` using a specified VS Code output channel.
 *
 * @param {vscode.OutputChannel} outputChannel - The output channel where log messages will be written.
 * @returns {Logger} - An instance of the Logger class.
 */
export function createLogger(outputChannel: vscode.OutputChannel): Logger {
	return new Logger(outputChannel);
}
