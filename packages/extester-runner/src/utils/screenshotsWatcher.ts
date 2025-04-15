import * as vscode from 'vscode';
import { Logger } from '../logger/logger';
import path from 'path';
import * as fs from 'fs';
import { ScreenshotsTreeProvider } from '../providers/screenshotsTreeProvider';

let watcher: vscode.FileSystemWatcher | undefined;

/**
 * Creates a file system watcher to monitor changes in the screenshots folder.
 *
 * This function sets up a `FileSystemWatcher` that listens for file creation, deletion,
 * and modification events. When an event occurs, it logs the change and refreshes
 * the test tree view to reflect the updates.
 *
 * @param {vscode.ExtensionContext} context - The extension context, used for managing subscriptions.
 * @param {ScreenshotsTreeProvider} screenshotsDataProvider - The tree data provider responsible for managing the screenshots view.
 * @param {Logger} logger - The logging utility for debugging and tracking file system events.
 */
export function createScreenshotsWatcher(context: vscode.ExtensionContext, screenshotsDataProvider: ScreenshotsTreeProvider, logger: Logger) {
	if (watcher) {
		watcher.dispose();
		logger.debug('ScreenshotsWacther: Disposed previous screenshots watcher.');
	}

	logger.debug('ScreenshotsWacther: Creating screenshots system watcher');

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

	const screenshotsDirectory = path.join(baseTempDir, 'screenshots');

	if (!fs.existsSync(screenshotsDirectory)) {
		logger.error(`ScreenshotsWacther: Screenshots directory does not exist: ${screenshotsDirectory}`);
		return;
	}

	logger.info(`ScreenshotsWacther: Watching screenshots directory: ${screenshotsDirectory}`);

	watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(screenshotsDirectory, '**/*'));

	/**
	 * Event listener for file creation.
	 */
	watcher.onDidCreate(() => {
		screenshotsDataProvider.refresh();
	});

	/**
	 * Event listener for file deletion.
	 */
	watcher.onDidChange(() => {
		screenshotsDataProvider.refresh();
	});

	/**
	 * Event listener for file modification.
	 */
	watcher.onDidDelete(() => {
		screenshotsDataProvider.refresh();
	});

	// Register the watcher for automatic disposal when the extension is deactivated.
	context.subscriptions.push(watcher);
}
