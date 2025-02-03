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

import { CustomTreeSection, DefaultTreeSection, ExtensionsViewSection, SideBarView, ViewSection, ViewSectionConstructor } from '../../index.js';
import { WebElement, error } from 'selenium-webdriver';
import { AbstractElement } from '../AbstractElement.js';

/**
 * Page object representing the view container of a side bar view
 */
export class ViewContent extends AbstractElement {
	constructor(view: SideBarView = new SideBarView()) {
		super(ViewContent.locators.ViewContent.constructor, view);
	}

	/**
	 * Finds whether a progress bar is active at the top of the view
	 * @returns Promise resolving to true/false
	 */
	async hasProgress(): Promise<boolean> {
		const progress = await this.findElement(ViewContent.locators.ViewContent.progress);
		const hidden = await progress.getAttribute('aria-hidden');
		if (hidden === 'true') {
			return false;
		}
		return true;
	}

	/**
	 * Retrieves a collapsible view content section by its title.
	 * Generic parameter allows caller to cast returned section to
	 * desired type, however it is caller's responsibility to check
	 * whether type is compatible with desired type.
	 * @param title Title of the section
	 * @returns Promise resolving to ViewSection object
	 */
	getSection<T extends ViewSection>(title: string): Promise<T>;
	/**
	 * Retrieves a collapsible view content section by its title.
	 * Type parameter allows caller to use custom section implementation,
	 * however it is caller's responsibility to check
	 * whether type is compatible with desired type.
	 * @param title Title of the section
	 * @param type ViewSection constructor to be used
	 * @returns Promise resolving to object specified by type
	 */
	getSection<T extends ViewSection>(title: string, type: ViewSectionConstructor<T>): Promise<T>;
	/**
	 * Retrieves a collapsible view content section by predicate.
	 * Generic parameter allows caller to cast returned section to
	 * desired type, however it is caller's responsibility to check
	 * whether type is compatible with desired type.
	 * @param predicate Predicate to be used when searching
	 * @returns Promise resolving to ViewSection object
	 */
	getSection<T extends ViewSection>(predicate: (section: ViewSection) => boolean | PromiseLike<boolean>): Promise<T>;
	/**
	 * Retrieves a collapsible view content section by predicate.
	 * Type parameter allows caller to use custom section implementation,
	 * however it is caller's responsibility to check
	 * whether type is compatible with desired type.
	 * @param predicate Predicate to be used when searching
	 * @param type ViewSection constructor to be used
	 * @returns Promise resolving to object specified by type
	 */
	getSection<T extends ViewSection>(predicate: (section: ViewSection) => boolean | PromiseLike<boolean>, type: ViewSectionConstructor<T>): Promise<T>;
	async getSection<T extends ViewSection>(
		titleOrPredicate: string | ((section: ViewSection) => boolean | PromiseLike<boolean>),
		type?: ViewSectionConstructor<T>,
	): Promise<T> {
		const sections = await this.getSections();
		const predicate =
			typeof titleOrPredicate === 'string' ? async (section: ViewSection) => (await section.getTitle()) === titleOrPredicate : titleOrPredicate;

		for (const section of sections) {
			if (await predicate(section)) {
				if (type !== undefined && !(section instanceof type)) {
					return new type(section, this);
				}
				return section as T;
			}
		}
		if (typeof titleOrPredicate === 'string') {
			throw new error.NoSuchElementError(`No section with title '${titleOrPredicate}' found`);
		} else {
			throw new error.NoSuchElementError(`No section satisfying predicate found`);
		}
	}

	/**
	 * Retrieves all the collapsible view content sections
	 * @returns Promise resolving to array of ViewSection objects
	 */
	async getSections(): Promise<ViewSection[]> {
		const sections: ViewSection[] = [];
		const elements = await this.findElements(ViewContent.locators.ViewContent.section);
		for (const element of elements) {
			sections.push(await this.createSection(element));
		}
		return sections;
	}

	private async createSection<T extends ViewSection>(panel: WebElement, type?: ViewSectionConstructor<T>): Promise<ViewSection> {
		if (type !== undefined) {
			return new type(panel, this);
		}

		const section: ViewSection = new DefaultTreeSection(panel, this);
		const types = ViewContent.locators.DefaultTreeSection.type;
		const locators = ViewContent.locators;

		if (await types.default(section, locators)) {
			return section;
		} else if (await types.marketplace.extension(section, locators)) {
			return new ExtensionsViewSection(panel, this);
		} else {
			return new CustomTreeSection(panel, this);
		}
	}
}
