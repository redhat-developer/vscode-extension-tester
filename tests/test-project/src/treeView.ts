import * as vscode from 'vscode';
import { ERROR_MESSAGE_COMMAND } from './extension';

/**
 * Test tree view as shown in treeview sample extension available at
 * https://github.com/microsoft/vscode-extension-samples/tree/master/tree-view-sample
 */
export class TreeView {
	constructor(context: vscode.ExtensionContext) {
		const view = vscode.window.createTreeView('testView', {
			treeDataProvider: dataProvider(),
			showCollapseAll: true,
		});
		context.subscriptions.push(view);
	}
}

type Tree = { [key: string]: Tree | undefined | null };

// structure of the test tree:
// leafs are keys that are undefined or null. If it is undefined, then its collapsibleState is None, if it null, then it is Collapsed
// The tree element with the key 'd' is special: it has a command attached to it. It thus cannot be expanded by simply clicking on it, as that just triggers the command.
const tree: Tree = {
	a: {
		aa: {
			aaa: {
				aaaa: {
					aaaaa: {
						aaaaaa: undefined,
					},
				},
			},
		},
		ab: undefined,
	},
	b: {
		ba: undefined,
		bb: undefined,
	},
	c: null,
	d: {
		da: undefined,
		db: undefined,
	},
};
const nodes: any = {};

function dataProvider(): vscode.TreeDataProvider<{ key: string }> {
	return {
		getChildren: (element?: { key: string }): { key: string }[] => {
			return getChildren(element?.key).map((key: string) => getNode(key));
		},
		getTreeItem: (element: { key: string }): vscode.TreeItem => {
			const treeItem = getTreeItem(element.key);
			treeItem.id = element.key;
			if (element.key === 'd') {
				treeItem.command = {
					title: 'show an error',
					command: ERROR_MESSAGE_COMMAND,
				};
			}
			return treeItem;
		},
		getParent: ({ key }: { key: string }): { key: string } => {
			const parentKey = key.substring(0, key.length - 1);
			return new Key(parentKey);
		},
	};
}

function getChildren(key: string | undefined): string[] {
	if (!key) {
		return Object.keys(tree);
	}
	const treeElement = getTreeElement(key);
	if (treeElement) {
		return Object.keys(treeElement);
	}
	return [];
}

function getTreeItem(key: string): vscode.TreeItem {
	const treeElement = getTreeElement(key);
	let collapsibleState: vscode.TreeItemCollapsibleState;
	if (treeElement === undefined) {
		collapsibleState = vscode.TreeItemCollapsibleState.None;
	} else {
		collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
	}
	return {
		label: key,
		tooltip: `Tooltip for ${key}`,
		description: `Description for ${key}`,
		collapsibleState,
		contextValue: 'ExtensionTreeItem',
	};
}

function getTreeElement(element: string): null | undefined | Tree {
	let parent: Tree | null | undefined = tree;
	for (let i = 0; i < element.length; i++) {
		parent = parent[element.substring(0, i + 1)];
		if (parent === null || parent === undefined) {
			return parent;
		}
	}
	return parent;
}

function getNode(key: string): { key: string } {
	if (!nodes[key]) {
		nodes[key] = new Key(key);
	}
	return nodes[key];
}

class Key {
	constructor(readonly key: string) {}
}
