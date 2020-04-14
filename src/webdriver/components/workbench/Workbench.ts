import { AbstractElement } from "../AbstractElement";
import { WebElement, Key, until } from "selenium-webdriver";
import { TitleBar } from "../menu/TitleBar";
import { SideBarView } from "../sidebar/SideBarView";
import { ActivityBar } from "../activityBar/ActivityBar";
import { StatusBar } from "../statusBar/StatusBar";
import { EditorView } from "../editor/EditorView";
import { BottomBarPanel } from "../bottomBar/BottomBarPanel";
import { Notification, StandaloneNotification } from "./Notification";
import { NotificationsCenter } from "./NotificationsCenter";
import { QuickOpenBox } from "./input/QuickOpenBox";
import { SettingsEditor } from "../editor/SettingsEditor";
import { InputBox } from "./input/InputBox";
import { VSBrowser } from "../../browser";

/**
 * Handler for general workbench related actions
 */
export class Workbench extends AbstractElement {
    constructor() {
        super(Workbench.locators.Workbench.constructor);
    }

    /**
     * Get a title bar handle
     */
    getTitleBar(): TitleBar {
        return new TitleBar();
    }

    /**
     * Get a side bar handle
     */
    getSideBar(): SideBarView {
        return new SideBarView();
    }

    /**
     * Get an activity bar handle
     */
    getActivityBar(): ActivityBar {
        return new ActivityBar();
    }

    /**
     * Get a status bar handle
     */
    getStatusBar(): StatusBar {
        return new StatusBar();
    }

    /**
     * Get a bottom bar handle
     */
    getBottomBar(): BottomBarPanel {
        return new BottomBarPanel();
    }

    /**
     * Get a handle for the editor view
     */
    getEditorView(): EditorView {
        return new EditorView();
    }

    /**
     * Get all standalone notifications (notifications outside the notifications center)
     * @returns Promise resolving to array of Notification objects
     */
    async getNotifications(): Promise<Notification[]> {
        const notifications: Notification[] = [];
        let container: WebElement;
        try {
            container = await this.findElement(Workbench.locators.Workbench.notificationContainer);
        } catch (err) {
            return [];
        }
        const elements = await container.findElements(Workbench.locators.Workbench.notificationItem);
        
        for (const element of elements) {
            notifications.push(await new StandaloneNotification(await element.getAttribute('id')).wait());
        }
        return notifications;
    }

    /**
     * Opens the notifications center
     * @returns Promise resolving to NotificationsCenter object
     */
    openNotificationsCenter(): Promise<NotificationsCenter> {
        return new StatusBar().openNotificationsCenter();
    }
    
    /**
     * Opens the settings editor
     *
     * @returns promise that resolves to a SettingsEditor instance
     */
    async openSettings(): Promise<SettingsEditor> {
        await this.executeCommand('open user settings');
        await Workbench.driver.wait(until.elementLocated(Workbench.locators.Editor.constructor));
        await new Promise((res) => setTimeout(res, 500));
        return new SettingsEditor();
    }

    /**
     * Open the VS Code command line prompt
     * @returns Promise resolving to InputBox (vscode 1.44+) or QuickOpenBox (vscode up to 1.43) object
     */
    async openCommandPrompt(): Promise<QuickOpenBox | InputBox> {
        await this.getDriver().actions().sendKeys(Key.F1).perform();
        if (VSBrowser.instance.version >= '1.44.0') {
            return InputBox.create();
        }
        return QuickOpenBox.create();
     }

    /**
     * Open the command prompt, type in a command and execute
     * @param command text of the command to be executed
     * @returns Promise resolving when the command prompt is confirmed
     */
    async executeCommand(command: string): Promise<void> {
        const prompt = await this.openCommandPrompt();
        await prompt.setText(`>${command}`);
        await prompt.confirm();
    }
}