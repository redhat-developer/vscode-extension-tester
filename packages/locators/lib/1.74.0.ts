import { By, LocatorDiff } from "@redhat-developer/page-objects";
export const diff: LocatorDiff = {
    locators: {
        WebView: {
            container: (id: string) => By.xpath(`.//div[@data-parent-flow-to-element-id='${id}']`),
            attribute: 'id'
        }
    }
}