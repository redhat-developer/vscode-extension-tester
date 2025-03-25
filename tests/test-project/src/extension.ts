import * as path from 'path';
import * as vscode from 'vscode';
import { CatScratchEditorProvider } from './catScratchEditor';
import { CodelensProvider } from './codelensProvider';
import { TreeView, TreeView2 } from './treeView';

export const ERROR_MESSAGE_COMMAND = 'extension.errorMsg';

export function activate(context: vscode.ExtensionContext) {
	const openCommand = vscode.commands.registerCommand('extension.openFile', async () => {
		const document = await vscode.workspace.openTextDocument(vscode.Uri.file(path.resolve(__dirname, '..', '..', 'resources', 'test-file.ts')));
		await vscode.window.showTextDocument(document);
	});
	const openFolder = vscode.commands.registerCommand('extension.openFolder', () => {
		const dirpath = path.resolve(__dirname, '..', '..', 'resources', 'test-folder');
		vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, {
			uri: vscode.Uri.file(dirpath),
		});
	});
	const closeFolder = vscode.commands.registerCommand('extension.closeFolder', () => {
		vscode.workspace.updateWorkspaceFolders(0, 1);
	});
	const testCommand = vscode.commands.registerCommand('extension.test', async () => {
		await vscode.window.showQuickPick([{ label: 'TestLabel', description: 'Test Description' }]);
	});
	const webViewCommand = vscode.commands.registerCommand('extension.webview', async () => {
		const col: vscode.ViewColumn = (vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined) || vscode.ViewColumn.One;
		openTestView(col);
	});

	const columns: vscode.ViewColumn[] = [vscode.ViewColumn.Two, vscode.ViewColumn.Three, vscode.ViewColumn.Four];
	for (const c of columns) {
		const webViewCmd = vscode.commands.registerCommand(`extension.webview.${c}`, async () => {
			openTestView(c);
		});
		context.subscriptions.push(webViewCmd);
	}

	const notificationCommand = vscode.commands.registerCommand('extension.notification', async () => {
		await vscode.window.showInformationMessage('This is a notification', 'Yes', 'No');
	});
	const quickPickCommand = vscode.commands.registerCommand('extension.quickpick', async () => {
		await vscode.window.showQuickPick(['test1', 'test2', 'test3'], {
			canPickMany: true,
			ignoreFocusOut: true,
		});
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.helloWorld', async () => {
			await vscode.window.showInformationMessage('Hello World!');
		}),
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.helloWorld2', async () => {
			await vscode.window.showInformationMessage('Hello World, Test Project!');
		}),
	);
	context.subscriptions.push(openCommand);
	context.subscriptions.push(openFolder);
	context.subscriptions.push(closeFolder);
	context.subscriptions.push(testCommand);
	context.subscriptions.push(webViewCommand);
	context.subscriptions.push(notificationCommand);
	context.subscriptions.push(quickPickCommand);
	context.subscriptions.push(vscode.commands.registerCommand('extension.warningMsg', () => vscode.window.showWarningMessage('This is a warning!')));
	context.subscriptions.push(vscode.commands.registerCommand(ERROR_MESSAGE_COMMAND, () => vscode.window.showErrorMessage('This is an error!')));
	context.subscriptions.push(CatScratchEditorProvider.register(context));

	new TreeView(context, 'testView');
	new TreeView2(context, 'testView2');

	context.subscriptions.push(
		vscode.commands.registerCommand('testView.refresh', async () => {
			await vscode.window.showInformationMessage('Refresh View button clicked!');
		}),
	);

	context.subscriptions.push(
		vscode.window.createTreeView('emptyView', {
			treeDataProvider: {
				getChildren: () => (emptyViewNoContent ? undefined : [{ key: 'There is content!' }]),
				getTreeItem: (e) => new vscode.TreeItem(e.key),
				onDidChangeTreeData: emitter.event,
			},
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.populateTestView', async () => {
			emptyViewNoContent = false;
			emitter.fire(undefined);
		}),
	);

	const codelensProvider = new CodelensProvider();
	context.subscriptions.push(vscode.languages.registerCodeLensProvider('*', codelensProvider));
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.enableCodeLens', async () => {
			await vscode.workspace.getConfiguration('testProject').update('enableCodeLens', true, true);
		}),
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.disableCodeLens', async () => {
			await vscode.workspace.getConfiguration('testProject').update('enableCodeLens', false, true);
		}),
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.codelensAction', async (args: any) => {
			await vscode.window.showInformationMessage(`CodeLens action clicked with args=${args}`);
		}),
	);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('myPanelView', new MyPanelView()));
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('mySidePanelView', new MySidePanelView()));

	vscode.commands.registerCommand('extension.treeItemAction', async () => {});
}

export function deactivate() {}

let emptyViewNoContent: boolean = true;
const emitter = new vscode.EventEmitter<undefined>();

function openTestView(viewColumn: vscode.ViewColumn) {
	const randomWebViewTitle = 'Test WebView ' + Math.floor(Math.random() * 100);
	const panel = vscode.window.createWebviewPanel('testView', randomWebViewTitle, viewColumn);
	const disposables: vscode.Disposable[] = [];

	const update = (title: string) => {
		panel.title = title;
		panel.webview.html = `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>${title}</title>
			</head>
			<body>
				<h1>This is a web view with title: ${title}</h1>
			</body>
			</html>`;
	};
	update(randomWebViewTitle);

	panel.onDidDispose(
		() => {
			while (disposables.length) {
				const x = disposables.pop();
				if (x) {
					x.dispose();
				}
			}
		},
		null,
		disposables,
	);

	panel.onDidChangeViewState(
		() => {
			if (panel.visible) {
				update(randomWebViewTitle);
			}
		},
		null,
		disposables,
	);
}

class MyPanelView implements vscode.WebviewViewProvider {
	resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
		webviewView.webview.html =
			'<!DOCTYPE html><html><head><title>My Panel View</title></head><body><div><h1>Shopping List</h1><ul><li>Apple</li><li>Banana</li></ul></div></body></html>';
	}
}

class MySidePanelView implements vscode.WebviewViewProvider {
	resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
		webviewView.webview.html =
			'<!DOCTYPE html><html><head><title>My Side Panel View</title></head><body><div><h1>Shopping Side List</h1><ul><li>Side Apple</li><li>Side Banana</li></ul></div></body></html>';
	}
}
