import { OpenFolderDialog, LinuxFolderDialog, WindowsFolderDialog } from "./openFolderDialog";

/**
 * Handles native dialogs for different platforms
 */
export class DialogHandler {

    /**
     * Get the appropriate native dialog for opening folders.
     * Returns platform specific dialog object.
     */
    static async getFolderDialog(): Promise<OpenFolderDialog> {
        await new Promise((res) => { setTimeout(res, 1000); });
        switch (process.platform) {
            case 'win32': {
                return new WindowsFolderDialog();
            }
            case 'darwin': {
                break;
            }
            case 'linux': {
                return new LinuxFolderDialog();
            }
        }
        return new LinuxFolderDialog();
    }
}