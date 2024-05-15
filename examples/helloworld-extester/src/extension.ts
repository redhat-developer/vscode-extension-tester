// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "helloworld-extester" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});

	let webViewCommand = vscode.commands.registerCommand('extension.webview', async () => {
		TestView.createOrShow();
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(webViewCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {}

class TestView {
	private static instance: TestView | undefined;
	public static readonly viewType = 'testView';

	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow() {
		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

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
			(e) => {
				if (this._panel.visible) {
					this.update();
				}
			},
			null,
			this._disposables,
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
