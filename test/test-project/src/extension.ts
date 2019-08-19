import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World!');
	});
	let openCommand = vscode.commands.registerCommand('extension.openFile', async () => {
		const document = await vscode.workspace.openTextDocument(vscode.Uri.file(path.resolve('./resources/test-file.ts')));
		await vscode.window.showTextDocument(document);
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(openCommand);
}

export function deactivate() {}
