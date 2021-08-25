import { execSync } from "child_process";

/**
 * Handler object for macOS based title bar 
 */
export class MacTitleBar {

    /**
     * Select an item from the mac menu bar by its path,
     * does not actually visibly open the menus.
     *
     * @param items varargs path to the given menu item
     *  each argument serves as a part of the path in order,
     *  
     *  e.g. ('File', 'Save') will select the 'Save' item from
     *  the 'File' submenu
     */
    static select(...items: string[]): void {
        let menuCounter = 0;
        const commands = [
            `tell application "System Events"`,
            `tell process "Code"`,
            `tell menu bar item "${items[0]}" of menu bar 1`
        ];
        for (let i = 1; i < items.length - 1; i++) {
            commands.push(`tell menu item "${items[i]}" of menu 1`);
            ++menuCounter;
        }
        if (items.length > 1) {
            commands.push(`click menu item "${items[items.length - 1]}" of menu 1`);
        }
        for (let i = 0; i < menuCounter + 3; i++) {
            commands.push(`end tell`);
        }
        const command = `osascript -e '${commands.join('\n')}'`;
        execSync(command, { stdio: 'inherit' });
    }
}