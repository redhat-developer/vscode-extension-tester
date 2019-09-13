import { BottomBarPanel } from "../../../extester";
import { AbstractElement } from "../AbstractElement";
import { WebElement } from 'selenium-webdriver';
import { ElementWithContexMenu } from "../ElementWithContextMenu";

/**
 * Problems view in the bottom panel
 */
export class ProblemsView extends AbstractElement {
    constructor(panel: BottomBarPanel = new BottomBarPanel()) {
        super(ProblemsView.locators.ProblemsView.constructor, panel);
    }

    /**
     * Set the filter using the input box on the problems view
     * @param pattern filter to use, prefferably a glob pattern
     */
    async setFilter(pattern: string): Promise<void> {
        const filterField = await this.clearFilter();
        await filterField.sendKeys(pattern);
    }

    /**
     * Clear all filters
     */
    async clearFilter(): Promise<WebElement> {
        const filterField = await this.enclosingItem.findElement(ProblemsView.locators.BottomBarPanel.actions)
            .findElement(ProblemsView.locators.ProblemsView.markersFilter)
            .findElement(ProblemsView.locators.ProblemsView.input);
        await filterField.clear();
        return filterField;
    }

    /**
     * Collapse all collapsible markers in the problems view
     */
    async collapseAll(): Promise<void> {
        const button = await this.enclosingItem.findElement(ProblemsView.locators.BottomBarPanel.actions)
            .findElement(ProblemsView.locators.ProblemsView.collapseAll);
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
        const elements = await this.findElements(ProblemsView.locators.ProblemsView.markerRow);
        for (const element of elements) {
            let marker: Marker;
            try {
                const label = await element.getAttribute(ProblemsView.locators.ProblemsView.rowLabel);
                await element.findElement(ProblemsView.locators.ProblemsView.markerContructor(label));
                marker = await new Marker(await element.getAttribute(ProblemsView.locators.ProblemsView.rowLabel), this).wait();
            } catch (err) {
                marker = await new Marker(await element.getAttribute(ProblemsView.locators.ProblemsView.rowLabel), this).wait();
            }
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
        super(ProblemsView.locators.ProblemsView.markerContructor(label), view);
    }

    /**
     * Get the type of the marker
     * Possible types are: File, Error, Warning
     */
    async getType(): Promise<MarkerType> {
        const twist = await this.findElement(ProblemsView.locators.ProblemsView.markerTwistie);
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
        return await this.getAttribute(ProblemsView.locators.ProblemsView.rowLabel);
    }

    /**
     * Expand/Collapse the marker if possible
     * @param expand true to expand, false to collapse
     */
    async toggleExpand(expand: boolean) {
        if (await this.getType() === MarkerType.File) {
            const klass = await this.findElement(ProblemsView.locators.ProblemsView.markerTwistie).getAttribute('class');
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