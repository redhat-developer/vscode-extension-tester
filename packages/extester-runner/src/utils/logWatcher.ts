import * as vscode from 'vscode';
import { Logger } from '../logger/logger';
import { LogsTreeProvider } from '../providers/logsTreeProvider';
import path from 'path';
import * as fs from 'fs';

let watcher: vscode.FileSystemWatcher | undefined;

/**
 * Creates a file system watcher to monitor changes in the logs folder.
 *
 * This function sets up a `FileSystemWatcher` that listens for file creation, deletion,
 * and modification events. When an event occurs, it logs the change and refreshes
 * the test tree view to reflect the updates.
 *
 * @param {vscode.ExtensionContext} context - The extension context, used for managing subscriptions.
 * @param {LogsTreeProvider} logsDataProvider - The tree data provider responsible for managing the logs view.
 * @param {Logger} logger - The logging utility for debugging and tracking file system events.
 */
export function createLogsWatcher(context: vscode.ExtensionContext, logsDataProvider: LogsTreeProvider, logger: Logger) {
	if (watcher) {
		watcher.dispose();
		logger.debug('LogWatcher: Disposed previous logs watcher');
	}

	logger.debug('LogWatcher: Creating logs system watcher.');

	const configuration = vscode.workspace.getConfiguration('extesterRunner');
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

	const tempDirSettings = configuration.get<string>('tempFolder')?.trim();
	const envTempDir = process.env.TEST_RESOURCES?.trim();

	let baseTempDir: string | undefined = tempDirSettings || envTempDir;

	if (baseTempDir && baseTempDir.length > 0) {
		baseTempDir = path.isAbsolute(baseTempDir) ? baseTempDir : path.join(workspaceFolder || '', baseTempDir);
	} else {
		baseTempDir = path.join(process.env.TMPDIR || process.env.TEMP || '/tmp', 'test-resources');
	}

	const logsDirectory = path.join(baseTempDir, 'settings', 'logs');

	if (!fs.existsSync(logsDirectory)) {
		logger.error(`LogWatcher: Logs directory does not exist: ${logsDirectory}`);
		return;
	}

	logger.info(`LogWatcher: Watching logs directory: ${logsDirectory}`);

	watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(logsDirectory, '**/*'));

	/**
	 * Event listener for file creation.
	 */
	watcher.onDidCreate(() => {
		logsDataProvider.refresh();
	});

	/**
	 * Event listener for file deletion.
	 */
	watcher.onDidChange(() => {
		logsDataProvider.refresh();
	});

	/**
	 * Event listener for file modification.
	 */
	watcher.onDidDelete(() => {
		logsDataProvider.refresh();
	});

	// Register the watcher for automatic disposal when the extension is deactivated.
	context.subscriptions.push(watcher);
}
