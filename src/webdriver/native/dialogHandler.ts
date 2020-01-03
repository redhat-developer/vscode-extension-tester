import { OpenDialog, LinuxOpenDialog, WindowsOpenDialog, MacOpenDialog } from "./openDialog";

/**
 * Handles native dialogs for different platforms
 */
export class DialogHandler {

    /**
     * Get the appropriate native dialog for opening folders.
     * Returns platform specific dialog object.
     */
    static async getOpenDialog(): Promise<OpenDialog> {
        await new Promise((res) => { setTimeout(res, 4000); });
        switch (process.platform) {
            case 'win32': {
                return new WindowsOpenDialog();
            }
            case 'darwin': {
                return new MacOpenDialog();
            }
            case 'linux': {
                return new LinuxOpenDialog();
            }
        }
        return new LinuxOpenDialog();
    }
}