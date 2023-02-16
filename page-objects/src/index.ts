import { WebDriver } from 'selenium-webdriver';
import { AbstractElement } from './components/AbstractElement';
import { LocatorLoader } from './locators/loader';

export * from 'selenium-webdriver';
export * from './locators/locators';
export * from './errors/NullAttributeError';

export * from './components/menu/Menu';
export * from './components/menu/MenuItem';
export * from './components/menu/TitleBar';
export * from './components/menu/MacTitleBar';
export * from './components/menu/ContextMenu';
export * from './components/menu/WindowControls';

export * from './components/activityBar/ActivityBar';
export * from './components/activityBar/ViewControl';
export * from './components/activityBar/ActionsControl';

export * from './components/sidebar/SideBarView';
export * from './components/sidebar/ViewTitlePart';
export * from './components/sidebar/ViewContent';
export * from './components/sidebar/ViewSection';
export * from './components/sidebar/ViewItem';
export * from './components/sidebar/WelcomeContent';

export * from './components/sidebar/tree/default/DefaultTreeSection';
export * from './components/sidebar/tree/default/DefaultTreeItem';
export * from './components/sidebar/tree/custom/CustomTreeSection';
export * from './components/sidebar/tree/custom/CustomTreeItem';
export * from './components/sidebar/extensions/ExtensionsViewSection';
export * from './components/sidebar/extensions/ExtensionsViewItem';
export { ScmView, ScmProvider, ScmChange } from './components/sidebar/scm/ScmView';
export * from './components/sidebar/scm/NewScmView';
export * from './components/sidebar/debug/DebugView';

export * from './components/bottomBar/BottomBarPanel';
export * from './components/bottomBar/ProblemsView';
export * from './components/bottomBar/Views';
export * from './components/statusBar/StatusBar';

export * from './components/editor/EditorView';
export * from './components/editor/Breakpoint';
export * from './components/editor/TextEditor';
export * from './components/editor/Editor';
export * from './components/editor/SettingsEditor';
export * from './components/editor/DiffEditor';
export * from './components/editor/WebView';
export * from './components/editor/ContentAssist';
export * from './components/editor/CustomEditor';

export { Notification, NotificationType } from './components/workbench/Notification';
export * from './components/workbench/NotificationsCenter';
export * from './components/workbench/input/Input';
export * from './components/workbench/input/InputBox';
export * from './components/workbench/input/QuickOpenBox';
export * from './components/workbench/Workbench';
export * from './components/workbench/DebugToolbar';

export * from './components/dialog/ModalDialog';

export * from './conditions/WaitForAttribute';

/**
 * Initialize the page objects for your tests
 * 
 * @param currentVersion version of the locators to load
 * @param baseVersion base version of the locators if you have multiple versions with diffs, otherwise leave the same as currentVersion
 * @param locatorFolder folder that contains locator files
 * @param driver WebDriver instance
 * @param browserID identifier/name of the browser (i.e. vscode)
 */
export function initPageObjects(currentVersion: string, baseVersion: string, locatorFolder: string, driver: WebDriver, browserID: string) {
    const locators = new LocatorLoader(currentVersion, baseVersion, locatorFolder).loadLocators();

    AbstractElement.init(locators, driver, browserID, currentVersion);
}