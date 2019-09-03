import { WebElement, WebDriver, Locator, until, By, Key } from "selenium-webdriver";
import { VSBrowser } from "../browser";

/**
 * Default wrapper for webelement
 */
export abstract class AbstractElement extends WebElement {

    public static ctlKey = process.platform === 'darwin' ? Key.COMMAND : Key.CONTROL;
    protected static driver: WebDriver;
    protected enclosingItem: WebElement;

    /**
     * Constructs a new element from a Locator or an existing WebElement
     * @param base WebDriver compatible Locator for the given element or a reference to an existing WeBelement
     * @param enclosingItem Locator or a WebElement reference to an element containing the element being constructed
     * this will be used to narrow down the search for the underlying DOM element
     */
    constructor(base: Locator | WebElement, enclosingItem?: WebElement | Locator) {
        if (!AbstractElement.driver) {
            AbstractElement.driver = VSBrowser.instance.driver;
        }
        let item: WebElement = AbstractElement.driver.findElement(By.tagName('body'));
        if (!enclosingItem) {
            enclosingItem = item;
        }

        if (enclosingItem instanceof WebElement) {
            item = enclosingItem;
        } else {
            item = AbstractElement.driver.findElement(enclosingItem);
        }

        if (base instanceof WebElement) {
            super(AbstractElement.driver, base.getId());
        } else {
            super(
                AbstractElement.driver,
                item.findElement(base).getId()
            );
        }
        this.enclosingItem = item;
    }

    /**
     * Wait for the element to become visible
     * @param timeout custom timeout for the wait
     * @returns thenable self reference
     */
    async wait(timeout: number = 5000): Promise<this> {
        await this.getDriver().wait(until.elementIsVisible(this), timeout);
        return this;
    }

    /**
     * Return a reference to the WebElement containing this element
     */
    getEnclosingElement(): WebElement {
        return this.enclosingItem;
    }

}