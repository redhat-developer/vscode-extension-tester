import { WebElement } from "selenium-webdriver";
import { TreeSection } from "../TreeSection";
import { CustomTreeItem } from "../custom/CustomTreeItem";
import { SectionBreakpoint } from "./SectionBreakpoint";

export class BreakpointSectionItem extends CustomTreeItem {
    constructor(element: WebElement, viewPart: TreeSection) {
        super(element, viewPart);
    }

    /**
     * Get breakpoint element which has context menu.
     * @returns SectionBreakpoint page object
     */
    async getBreakpoint(): Promise<SectionBreakpoint> {
        return new SectionBreakpoint(
            BreakpointSectionItem.locators.BreakpointSectionItem.breakpoint.constructor,
            this
        );
    }

    /**
     * Get status of the breakpoint.
     * @returns boolean indicating status
     */
    async isBreakpointEnabled(): Promise<boolean> {
        const locator = BreakpointSectionItem.locators.BreakpointSectionItem.breakpointCheckbox;
        const el = this.findElement(locator.constructor);
        return await locator.value(el);
    }

    /**
     * Change breakpoint status to desired state.
     * @param value new state
     */
    async setBreakpointEnabled(value: boolean): Promise<void> {
        if (await this.isBreakpointEnabled() === value) {
            return;
        }
        const locator = BreakpointSectionItem.locators.BreakpointSectionItem.breakpointCheckbox;
        const el = this.findElement(locator.constructor);
        await el.click();
    }

    async getLabel(): Promise<string> {
        const locator = BreakpointSectionItem.locators.BreakpointSectionItem.label;
        const el = this.findElement(locator.constructor);
        return await locator.value(el);
    }

    /**
     * Get breakpoint file path. Empty string is returned if path is not specified.
     * @returns file path of breakpoint or empty string
     */
    async getBreakpointFilePath(): Promise<string> {
        const locator = BreakpointSectionItem.locators.BreakpointSectionItem.filePath;
        const el = this.findElement(locator.constructor);
        return await locator.value(el);
    }

    /**
     * Get line number of the breakpoint.
     * @returns number indicating line position in file
     */
    async getBreakpointLine(): Promise<number> {
        const locator = BreakpointSectionItem.locators.BreakpointSectionItem.lineNumber;
        const el = this.findElement(locator.constructor);
        return Number.parseInt(await locator.value(el));
    }
}
