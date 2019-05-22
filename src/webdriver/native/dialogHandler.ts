import { OpenDialog, LinuxOpenDialog, WindowsOpenDialog } from "./openDialog";

/**
 * Handles native dialogs for different platforms
 */
export class DialogHandler {

    /**
     * Get the appropriate native dialog for opening folders.
     * Returns platform specific dialog object.
     */
    static async getOpenDialog(): Promise<OpenDialog> {
        await new Promise((res) => { setTimeout(res, 1000); });
        switch (process.platform) {
            case 'win32': {
                return new WindowsOpenDialog();
            }
            case 'darwin': {
                break;
            }
            case 'linux': {
                return new LinuxOpenDialog();
            }
        }
        return new LinuxOpenDialog();
    }
}