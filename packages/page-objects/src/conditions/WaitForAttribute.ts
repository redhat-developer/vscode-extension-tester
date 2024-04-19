import { WebElement } from "selenium-webdriver";

/**
 * Condition to wait until an element's attribute has a specified value
 * @param element WebElement to check
 * @param attribute attribute to check
 * @param value value to wait for the attribute to have
 */
export function waitForAttributeValue(element: WebElement, attribute: string, value: string) {
    return async () => {
        const result = await element.getAttribute(attribute);
        return result === value;
    };
}