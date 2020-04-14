import * as vscode from 'vscode';
import * as path from 'path';
import { TreeView } from './treeView';

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
		vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0,
			null, { uri: vscode.Uri.file(dirpath) });
	});
	let closeFolder = vscode.commands.registerCommand('extension.closeFolder', async () => {
		vscode.workspace.updateWorkspaceFolders(0, 1);
	});
	let testCommand = vscode.commands.registerCommand('extension.test', async () => {
		vscode.window.showQuickPick([{ label: 'TestLabel', description: 'Test Description' }]);
	});
	let webViewCommand = vscode.commands.registerCommand('extension.webview', async() => {
		TestView.createOrShow();
	});
	let notificationCommand = vscode.commands.registerCommand('extension.notification', () => {
		vscode.window.showInformationMessage('This is a notification', 'Yes', 'No');
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(openCommand);
	context.subscriptions.push(openFolder);
	context.subscriptions.push(closeFolder);
	context.subscriptions.push(testCommand);
	context.subscriptions.push(webViewCommand);
	context.subscriptions.push(notificationCommand);

	new TreeView(context);
}

export function deactivate() {}

class TestView {
	private static instance: TestView | undefined;
	public static readonly viewType = 'testView';

	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow() {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (TestView.instance) {
			TestView.instance._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(TestView.viewType, 'Test WebView', column || vscode.ViewColumn.One);
		TestView.instance = new TestView(panel);
	}

	private constructor(panel: vscode.WebviewPanel) {
		this._panel = panel;
		this.update();

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this.update();
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
		TestView.instance = undefined;
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private update() {
		this._panel.title = 'Test WebView';
		this._panel.webview.html = `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Test Webview</title>
		</head>
		<body>
			<h1>This is a web view</h1>
		</body>
		</html>`;
	}
}