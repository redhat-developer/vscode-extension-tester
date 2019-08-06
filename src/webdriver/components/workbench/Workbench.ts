import { AbstractElement } from "../AbstractElement";
import { By, WebElement, Key, until } from "selenium-webdriver";
import { TitleBar } from "../menu/TitleBar";
import { SideBarView } from "../sidebar/SideBarView";
import { ActivityBar } from "../activityBar/ActivityBar";
import { StatusBar } from "../statusBar/StatusBar";
import { EditorView } from "../editor/EditorView";
import { BottomBarPanel } from "../bottomBar/BottomBarPanel";
import { Notification, StandaloneNotification } from "./Notification";
import { NotificationsCenter } from "./NotificationsCenter";
import { QuickOpenBox } from "./input/QuickOpenBox";
import { Input } from "./input/Input";
import { SettingsEditor } from "../editor/SettingsEditor";

/**
 * Handler for general workbench related actions
 */
export class Workbench extends AbstractElement {
    constructor() {
        super(By.className('monaco-workbench'));
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
     */
    async getNotifications(): Promise<Notification[]> {
        const notifications: Notification[] = [];
        let container: WebElement;
        try {
            container = await this.findElement(By.className('notification-toast-container'));
        } catch (err) {
            return [];
        }
        const elements = await container.findElements(By.className('monaco-list-row'));
        
        for (const element of elements) {
            notifications.push(await new StandaloneNotification(await element.getAttribute('id')).wait());
        }
        return notifications;
    }

    /**
     * Opens the notifications center
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
        await Workbench.driver.wait(until.elementLocated(By.className('editor-instance')));
        return await new SettingsEditor().wait();
    }

    /**
     * Open the VS Code command line prompt
     */
    async openCommandPrompt(): Promise<Input> {
        await this.getDriver().actions().sendKeys(Key.F1).perform();
        return new QuickOpenBox().wait();
    }

    /**
     * Open the command prompt, type in a command and execute
     * @param command text of the command to be executed
     */
    async executeCommand(command: string): Promise<void> {
        const prompt = await this.openCommandPrompt();
        await prompt.setText(`>${command}`);
        await prompt.confirm();
    }
}