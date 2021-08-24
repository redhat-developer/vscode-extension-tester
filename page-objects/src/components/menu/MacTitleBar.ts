import { execSync } from "child_process";

export class MacTitleBar {

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