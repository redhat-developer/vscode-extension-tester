import { NativeDialog } from "./nativeDialog";
import * as pathj from 'path';
import * as fs from 'fs-extra';
import * as clipboard from 'clipboardy';
import * as robot from 'robotjs';

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

abstract class AbstractOpenDialog implements OpenDialog {
    selectPath(path: string): void | Promise<void> {
        throw new Error("Method not implemented.");
    }
    async confirm(): Promise<void> {
        robot.keyTap('enter');
        await new Promise((res) => { setTimeout(res, 4000); });
    }
    async cancel(): Promise<void> {
        robot.keyTap('escape');
    }
}

/**
 * Linux implementation of the open dialog
 */
export class LinuxOpenDialog extends AbstractOpenDialog {
    async selectPath(path: string): Promise<void> {
        const absolutePath = pathj.resolve(path);
        if (!fs.existsSync(absolutePath)) {
            throw new Error('The selected path does not exist');
        }
        robot.keyTap('left');
        robot.keyTap('up');
        robot.keyTap('down');
        robot.keyTap('enter');
        await new Promise((res) => { setTimeout(res, 500); });
        robot.keyTap('l', 'control');
        await new Promise((res) => { setTimeout(res, 500); });
        clipboard.writeSync(absolutePath);
        robot.keyTap('v', 'control');
        clipboard.writeSync('');
    }
}

/**
 * Windows implementation of the open dialog
 */
export class WindowsOpenDialog extends AbstractOpenDialog {
    async selectPath(path: string): Promise<void> {
        const absolutePath = pathj.resolve(path);
        if (!fs.existsSync(absolutePath)) {
            throw new Error('The selected path does not exist');
        }
        clipboard.writeSync(absolutePath);
        robot.keyTap('v', 'control');
        await new Promise((res) => { setTimeout(res, 500); });
        if (fs.statSync(absolutePath).isDirectory()) {
            robot.keyTap('tab');
            await new Promise((res) => { setTimeout(res, 500); });
        }
        clipboard.writeSync('');
    }
}

/**
 * MacOS implementation of the open dialog
 */
export class MacOpenDialog extends AbstractOpenDialog {
    async selectPath(path: string): Promise<void> {
        const absolutePath = pathj.resolve(path);
        if (!fs.existsSync(absolutePath)) {
            throw new Error('The selected path does not exist');
        }
        clipboard.writeSync(absolutePath);
        robot.keyTap('g', ['command', 'shift']);
        await new Promise((res) => { setTimeout(res, 500); });
        robot.keyTap('v', 'command');
        robot.keyTap('enter');
        clipboard.writeSync('');
    }
}