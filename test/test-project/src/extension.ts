import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World!');
	});
	let openCommand = vscode.commands.registerCommand('extension.openFile', async () => {
		const document = await vscode.workspace.openTextDocument(vscode.Uri.file(
			path.resolve(__dirname, '..', '..', 'resources', 'test-file.ts')));
		await vscode.window.showTextDocument(document);
	});
	let openFolder = vscode.commands.registerCommand('extension.openFolder', async () => {
		const dirpath = path.resolve(__dirname, '..', '..', 'resources', 'test-folder');
		await vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0,
			null, { uri: vscode.Uri.file(dirpath) });
	});
	let closeFolder = vscode.commands.registerCommand('extension.closeFolder', async () => {
		await vscode.workspace.updateWorkspaceFolders(0, 1);
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(openCommand);
	context.subscriptions.push(openFolder);
	context.subscriptions.push(closeFolder);
}

export function deactivate() {}
