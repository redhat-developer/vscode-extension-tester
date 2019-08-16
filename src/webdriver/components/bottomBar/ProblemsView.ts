import { BottomBarPanel } from "../../../extester";
import { AbstractElement } from "../AbstractElement";
import { By } from 'selenium-webdriver';
import { ElementWithContexMenu } from "../ElementWithContextMenu";

/**
 * Problems view in the bottom panel
 */
export class ProblemsView extends AbstractElement {
    constructor(panel: BottomBarPanel = new BottomBarPanel()) {
        super(By.id('workbench.panel.markers'), panel);
    }

    /**
     * Set the filter using the input box on the problems view
     * @param pattern filter to use, prefferably a glob pattern
     */
    async setFilter(pattern: string): Promise<void> {
        const filterField = await this.enclosingItem.findElement(By.className('title-actions'))
            .findElement(By.className('markers-panel-action-filter'))
            .findElement(By.tagName('input'));
        await filterField.clear();            
        await filterField.sendKeys(pattern);
    }

    /**
     * Collapse all collapsible markers in the problems view
     */
    async collapseAll(): Promise<void> {
        const button = await this.enclosingItem.findElement(By.className('title-actions'))
            .findElement(By.className('collapse-all'));
        await button.click();
    }

    /**
     * Get all markers from the problems view with the given type.
     * To get all markers regardless of type, use MarkerType.Any
     * @param type type of markers to retrieve
     * @returns array of Marker objects
     */
    async getAllMarkers(type: MarkerType): Promise<Marker[]> {
        const markers: Marker[] = [];
        const elements = await this.findElements(By.className('monaco-list-row'));
        for (const element of elements) {
            const marker = new Marker(await element.getAttribute('aria-label'), this);
            if (type === MarkerType.Any || type === await marker.getType()) {
                markers.push(marker);
            }
        }
        return markers;
    }
}

/**
 * Page object for marker in problems view
 */
export class Marker extends ElementWithContexMenu {
    constructor(label: string, view: ProblemsView) {
        super(By.xpath(`.//div[contains(@class, 'monaco-list-row') and contains(@aria-label, '${label}')]`), view);
    }

    /**
     * Get the type of the marker
     * Possible types are: File, Error, Warning
     */
    async getType(): Promise<MarkerType> {
        const twist = await this.findElement(By.className('monaco-tl-twistie'));
        if ((await twist.getAttribute('class')).indexOf('collapsible') > -1) {
            return MarkerType.File;            
        }
        const text = await this.getText();
        if (text.startsWith('Error')) {
            return MarkerType.Error;
        } else {
            return MarkerType.Warning;
        }
    }

    /**
     * Get the full text of the marker
     */
    async getText(): Promise<string> {
        return await this.getAttribute('aria-label');
    }

    /**
     * Expand/Collapse the marker if possible
     * @param expand true to expand, false to collapse
     */
    async toggleExpand(expand: boolean) {
        if (await this.getType() === MarkerType.File) {
            const klass = await this.findElement(By.className('monaco-tl-twistie')).getAttribute('class');
            if ((klass.indexOf('collapsed') > -1) === expand) {
                await this.click();
            }
        }
    }
}

/**
 * Possible types of markers
 *  - File = expandable item representing a file
 *  - Error = an error marker
 *  - Warning = a warning marker
 *  - Any = any of the above
 */
export enum MarkerType {
    File = 'file',
    Error = 'error',
    Warning = 'warning',
    Any = 'any'
}