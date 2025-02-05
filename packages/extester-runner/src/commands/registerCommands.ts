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
import { registerTestCommands } from './testCommands';
import { registerViewCommands } from './viewCommands';
import { registerFileCommands } from './fileCommands';
import { ExtesterTreeProvider } from '../providers/extesterTreeProvider';
import { Logger } from '../logger/logger';
import { settingsWatcher } from '../utils/settingsWatcher';
import { ScreenshotsTreeProvider } from '../providers/screenshotsTreeProvider';
import { LogsTreeProvider } from '../providers/logsTreeProvider';
import { registerScreenshotsCommands } from './screenshotsCommands';
import { registerLogsCommands } from './logsCommands';

/**
 * Registers all extension commands and initializes supporting utilities within the VS Code extension.
 *
 * This function sets up the core command registration and settings watching logic for the extension.
 * It organizes and registers commands across multiple domains, including:
 *
 * - **Test Management** (`registerTestCommands`): Registers commands related to running and managing tests.
 * - **View Management** (`registerViewCommands`): Registers commands for refreshing and controlling custom views.
 * - **File Operations** (`registerFileCommands`): Handles file-related actions (e.g., opening or saving files).
 * - **Screenshots Management** (`registerScreenshotsCommands`): Registers commands to handle screenshot viewing and actions.
 * - **Log Management** (`registerLogsCommands`): Registers commands for managing and displaying logs.
 * - **Settings Watcher** (`settingsWatcher`): Sets up watchers for configuration changes to trigger view updates.
 *
 * @param {vscode.ExtensionContext} context - The extension context, used for registering commands.
 * @param {ExtesterTreeProvider} treeDataProvider - The tree data provider for tests views.
 * @param {ScreenshotsTreeProvider} screenshotsDataProvider - The tree data provider for screenshots view.
 * @param {LogsTreeProvider} logsDataProvider - The tree data provider for managing for logs view.
 * @param {Logger} logger - The logging utility for debugging and error tracking.
 */
export function registerCommands(
	context: vscode.ExtensionContext,
	treeDataProvider: ExtesterTreeProvider,
	screenshotsDataProvider: ScreenshotsTreeProvider,
	logsDataProvider: LogsTreeProvider,
	logger: Logger,
) {
	logger.debug('Registering commands and relevant settings watcher');
	registerTestCommands(context, treeDataProvider, logger);
	registerViewCommands(context, treeDataProvider, logger);
	registerFileCommands(context, logger);
	registerScreenshotsCommands(context, screenshotsDataProvider, logger);
	registerLogsCommands(context, logsDataProvider, logger);
	settingsWatcher(context, treeDataProvider, screenshotsDataProvider, logsDataProvider, logger);
}
