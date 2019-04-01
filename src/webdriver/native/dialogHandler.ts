import { OpenFolderDialog, LinuxFolderDialog, WindowsFolderDialog } from "./openFolderDialog";

export class DialogHandler {

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