import * as path from 'path';
import * as fs from 'fs';
import { window, workspace, Uri, WorkspaceFoldersChangeEvent } from 'vscode';
import { EventEmitter } from 'events';

const emitter = new EventEmitter();
workspace.onDidChangeWorkspaceFolders(e => {
    emitter.emit('update', e);
});

export async function openFolder() {
    const dir = await promptPath(true, 'open');
    if (!dir) return;
    if(!workspace.updateWorkspaceFolders(0, workspace.workspaceFolders ? workspace.workspaceFolders.length : null, { uri: Uri.file(dir) })) {
        throw new Error(`Failed to open folder ${dir}`);
    }
    await waitForUpdate(dir);
}

export async function addFolderToWorkspace() {
    const dir = await promptPath(true, 'add');
    if (!dir) return;
    if(!workspace.updateWorkspaceFolders(0, null, { uri: Uri.file(dir) })) {
        throw new Error(`Failed to add folder ${dir}`);
    }
    await waitForUpdate(dir);
}

export async function openFile() {
    const file = await promptPath(false, 'open');
    if (!file) return;
    const document = await workspace.openTextDocument(Uri.file(file))
    await window.showTextDocument(document);
}

function waitForUpdate(dir: string): Promise<void> {
    return new Promise((res, rej) => {
        const timeout = setTimeout(rej, 5000, new Error('Workspace failed to update'));
        const listener = (e: WorkspaceFoldersChangeEvent) => {
            e.added.find((value) => {
                if(value.uri.fsPath === dir) {
                    clearTimeout(timeout);
                    emitter.removeListener('update', listener);
                    return res();
                }
            });
        };
        emitter.on('update', listener);
    });
}

function promptPath(folder: boolean, action: string) {
    return window.showInputBox({
        ignoreFocusOut: false,
        prompt: `Absolute path of the ${folder ? 'folder' : 'file'} to ${action}`,
        validateInput: value => { return validatePath(value, folder); }
    })
}

function validatePath(value: string, folder: boolean) {
    if (fs.existsSync(value)) {
        if (folder && !fs.lstatSync(value).isDirectory()) {
            return 'Selected path is not a folder';
        }
        if (!folder && !fs.lstatSync(value).isFile()) {
            return 'Selected path is not a file';
        }
        if (!path.isAbsolute(value)) {
            return 'Path must be absolute';
        }
        return '';
    } else {
        return 'Folder does not exist';
    }
}