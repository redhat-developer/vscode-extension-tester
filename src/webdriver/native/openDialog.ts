import { NativeDialog } from "./nativeDialog";
import * as pathj from 'path';
import * as fs from 'fs-extra';
import * as clipboard from 'clipboardy';
import { keyboard, Key } from '@nut-tree/nut-js';

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
        await this.tapKey(Key.Enter);
        await new Promise((res) => { setTimeout(res, 4000); });
    }
    async cancel(): Promise<void> {
        await this.tapKey(Key.Escape);
    }

    async tapKey(...keys: Key[]) {
        await keyboard.pressKey(...keys);
        await keyboard.releaseKey(...keys);
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
        await this.tapKey(Key.Left);
        await this.tapKey(Key.Up);
        await this.tapKey(Key.Down);
        await this.tapKey(Key.Enter);
        await new Promise((res) => { setTimeout(res, 500); });
        await this.tapKey(Key.LeftControl, Key.L);
        await new Promise((res) => { setTimeout(res, 500); });
        clipboard.writeSync(absolutePath);
        await this.tapKey(Key.LeftControl, Key.V);
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
        await this.tapKey(Key.LeftControl, Key.V);
        await new Promise((res) => { setTimeout(res, 500); });
        if (fs.statSync(absolutePath).isDirectory()) {
            await this.tapKey(Key.Tab);
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
        await this.tapKey(Key.LeftSuper, Key.LeftShift, Key.G);
        await new Promise((res) => { setTimeout(res, 500); });
        await this.tapKey(Key.LeftSuper, Key.V);
        await this.tapKey(Key.Enter);
        clipboard.writeSync('');
    }
}