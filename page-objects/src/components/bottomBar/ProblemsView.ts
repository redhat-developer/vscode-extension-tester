import { BottomBarPanel } from "../..";
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
     * @param pattern filter to use, preferably a glob pattern
     * @returns Promise resolving when the filter pattern is filled in
     */
    async setFilter(pattern: string): Promise<void> {
        const filterField = await this.clearFilter();
        await filterField.sendKeys(pattern);
    }

    /**
     * Clear all filters
     * @returns Promise resolving to the filter field WebElement
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
     * @returns Promise resolving when the collapse all button is pressed
     */
    async collapseAll(): Promise<void> {
        const button = await this.enclosingItem.findElement(ProblemsView.locators.BottomBarPanel.actions)
            .findElement(ProblemsView.locators.ProblemsView.collapseAll);
        await button.click();
    }

    /**
     * @deprecated The method should not be used and getAllVisibleMarkers() should be used instead.
     */
     async getAllMarkers(type: MarkerType): Promise<Marker[]> {
        return this.getAllVisibleMarkers(type);
    }

    /**
     * Get all visible markers from the problems view with the given type.
     * Warning: this only returns the markers that are visible, and not the
     * entire list, so calls to this function may change depending on the
     * environment  in which the tests are running in.
     * To get all markers regardless of type, use MarkerType.Any
     * @param type type of markers to retrieve
     * @returns Promise resolving to array of Marker objects
     */
    async getAllVisibleMarkers(type: MarkerType): Promise<Marker[]> {
        const markers: Marker[] = [];
        const elements = await this.findElements(ProblemsView.locators.ProblemsView.markerRow);
        for (const element of elements) {
            let marker: Marker;
            marker = await new Marker(element, this).wait();
            if (type === MarkerType.Any || type === await marker.getType()) {
                markers.push(marker);
            }
        }
        return markers;
    }

    /**
     * Gets the count badge
     * @returns Promise resolving to the WebElement representing the count badge
     */
    async getCountBadge(): Promise<WebElement> {
        return await this.findElement(ProblemsView.locators.ProblemsView.changeCount);
    }
}

/**
 * Page object for marker in problems view
 */
export class Marker extends ElementWithContexMenu {
    constructor(element: WebElement, view: ProblemsView) {
        super(element, view);
    }

    /**
     * Get the type of the marker
     * Possible types are: File, Error, Warning
     * @returns Promise resolving to a MarkerType
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
     * @returns Promise resolving to marker text
     */
    async getText(): Promise<string> {
        return await this.getAttribute(ProblemsView.locators.ProblemsView.rowLabel);
    }

    /**
     * Expand/Collapse the marker if possible
     * @param expand true to expand, false to collapse
     * @returns Promise resolving when the expand/collapse twistie is clicked
     */
    async toggleExpand(expand: boolean): Promise<void> {
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