import { WebElement } from "selenium-webdriver";

export function waitForAttributeValue(element: WebElement, attribute: string, value: string) {
    return async function() {
        const result = await element.getAttribute(attribute);
        return result === value;
    }
}