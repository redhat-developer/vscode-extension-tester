import { NativeDialog } from "./nativeDialog";
import * as pathj from 'path';
import * as fs from 'fs-extra';
const robot = require('node-key-sender');

/**
 * General open native dialog
 */
export interface OpenDialog extends NativeDialog {
    /**
     * Enters the given path into the dialog selection
     * @param path path to select
     */
    selectPath(path: string): void | Promise<void>;
}

/**
 * Linux implementation of the open dialog
 */
export class LinuxOpenDialog implements OpenDialog {
    async selectPath(path: string): Promise<void> {
        const absolutePath = pathj.resolve(path);
        if (!fs.existsSync(absolutePath)) {
            throw new Error('The selected path does not exist');
        }
        await robot.sendKey('left');
        await new Promise((res) => { setTimeout(res, 500); });
        await robot.sendKey('up');
        await new Promise((res) => { setTimeout(res, 500); });
        await robot.sendKey('down');
        await new Promise((res) => { setTimeout(res, 500); });
        await robot.sendKey('enter');
        await new Promise((res) => { setTimeout(res, 500); });
        await robot.sendCombination(['control', 'l']);
        await new Promise((res) => { setTimeout(res, 500); });
        await robot.sendText(absolutePath);
    }

    async confirm(): Promise<void> {
        await robot.sendKey('enter');
        await new Promise((res) => { setTimeout(res, 4000); });
    }

    async cancel(): Promise<void> {
        await robot.sendKey('escape');
    }
}

/**
 * Windows implementation of the open dialog
 */
export class WindowsOpenDialog implements OpenDialog {
    async selectPath(path: string): Promise<void> {
        const absolutePath = pathj.resolve(path);
        if (!fs.existsSync(absolutePath)) {
            throw new Error('The selected path does not exist');
        }
        const layout = robot.getKeyboardLayout();
        layout[':'] = 'shift-semicolon';
        robot.setKeyboardLayout(layout);
        await robot.sendText(absolutePath);
        await new Promise((res) => { setTimeout(res, 500); });
        if (fs.statSync(absolutePath).isDirectory()) {
            await robot.sendKey('tab');
            await new Promise((res) => { setTimeout(res, 500); });
        }
    }

    async confirm(): Promise<void> {
        await robot.sendKey('enter');
        await new Promise((res) => { setTimeout(res, 4000); });
    }

    async cancel(): Promise<void> {
        await robot.sendKey('escape');
    }
}