import { By, LocatorDiff } from "@vscode-extension-tester/page-objects";
export const diff: LocatorDiff = {
    locators: {
        WebView: {
            container: (id: string) => By.xpath(`.//div[@data-parent-flow-to-element-id='${id}']`),
            attribute: 'id'
        }
    }
}