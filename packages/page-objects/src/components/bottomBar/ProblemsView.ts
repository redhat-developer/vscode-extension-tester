/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BottomBarPanel } from '../..';
import { AbstractElement } from '../AbstractElement';
import { WebElement } from 'selenium-webdriver';
import { ElementWithContextMenu } from '../ElementWithContextMenu';

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
		const filterField = await this.enclosingItem
			.findElement(ProblemsView.locators.BottomBarPanel.actions)
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
		const button = await this.enclosingItem
			.findElement(ProblemsView.locators.BottomBarPanel.actions)
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
			const marker = await new Marker(element, this).wait();
			if (type === MarkerType.Any || type === (await marker.getType())) {
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
 * Page object for a Marker in Problems view
 */
export class Marker extends ElementWithContextMenu {
	constructor(element: WebElement, view: ProblemsView) {
		super(element, view);
	}

	/**
	 * Get the type of the marker. Possible types are:
	 * - File
	 * - Error
	 * - Warning
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
	 * Get the full text of the Marker row
	 * @returns Promise resolving to a Marker row text
	 */
	async getText(): Promise<string> {
		return await this.getAttribute(ProblemsView.locators.ProblemsView.rowLabel);
	}

	/**
	 * Get the Marker label text
	 * @returns Promise resolving to a Marker label
	 */
	async getLabel(): Promise<string> {
		return await (await this.findElement(ProblemsView.locators.ProblemsView.label)).getText();
	}

	/**
	 * Expand/Collapse the Marker if possible
	 * @param expand True to expand, False to collapse
	 * @returns Promise resolving when the expand/collapse twistie is clicked
	 */
	async toggleExpand(expand: boolean): Promise<void> {
		if ((await this.getType()) === MarkerType.File) {
			const klass = await this.findElement(ProblemsView.locators.ProblemsView.markerTwistie).getAttribute('class');
			if (klass.indexOf('collapsed') > -1 === expand) {
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
	Any = 'any',
}
