import * as vscode from 'vscode';
import * as ws from './workspace';

export function activate(context: vscode.ExtensionContext) {
	let openFolder = vscode.commands.registerCommand('extest.openFolder', async () => {
		await ws.openFolder();
	});
	let addFolder = vscode.commands.registerCommand('extest.addFolder', async () => {
		await ws.addFolderToWorkspace();
	});
	let openFile = vscode.commands.registerCommand('extest.openFile', async () => {
		await ws.openFile();
	});

	context.subscriptions.push(openFolder);
	context.subscriptions.push(addFolder);
	context.subscriptions.push(openFile);
}

export function deactivate() {}
