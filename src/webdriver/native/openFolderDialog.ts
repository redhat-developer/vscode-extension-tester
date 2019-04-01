import { NativeDialog } from "./nativeDialog";
import * as robot from 'robotjs';
import * as pathj from 'path';
import * as fs from 'fs-extra';

export interface OpenFolderDialog extends NativeDialog {
    selectFolder(path: string): void | Promise<void>;
}

export class LinuxFolderDialog implements OpenFolderDialog {
    selectFolder(path: string): void {
        const absolutePath = pathj.resolve(path);
        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
            throw new Error('The selected path is not an existing directory');
        }
        robot.keyTap('down');
        robot.keyTap('l', 'control');
        robot.typeString(absolutePath);
    }

    async confirm(): Promise<void> {
        robot.keyTap('enter');
        await new Promise((res) => { setTimeout(res, 4000); });
    }

    cancel(): void {
        robot.keyTap('escape');
    }
}

export class WindowsFolderDialog implements OpenFolderDialog {
    selectFolder(path: string): void {
        const absolutePath = pathj.resolve(path);
        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
            throw new Error('The selected path is not an existing directory');
        }
        robot.keyTap('l', 'control');
        robot.typeString(absolutePath);
        robot.keyTap('enter');
        robot.keyTap('space');
        robot.keyTap('enter');
    }

    async confirm(): Promise<void> {
        robot.keyTap('enter');
        await new Promise((res) => { setTimeout(res, 4000); });
    }

    cancel(): void {
        robot.keyTap('escape');
    }
}