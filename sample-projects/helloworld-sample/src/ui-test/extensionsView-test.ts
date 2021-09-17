import { expect } from 'chai';
import { ActivityBar, ExtensionsViewItem, ExtensionsViewSection } from 'vscode-extension-tester';
const pjson = require('../../package.json');


// sample test code on how to look for an extension
describe('Example extension view tests', () => {
    let helloExtension: ExtensionsViewItem;
    
    before(async function () {
        this.timeout(15000);
        // open the extensions view
        const view = await (await new ActivityBar().getViewControl('Extensions'))?.openView();

        // we want to find the hello-world extension (this project)
        // first we need a view section, best place to get started is the 'Installed' section
        const extensions = await view?.getContent().getSection('Installed') as ExtensionsViewSection;

        // search for the extension, you can use any syntax vscode supports for the search field
        // it is best to prepend @installed to the extension name if you don't want to see the results from marketplace
        // also, getting the name directly from package.json seem like a good idea
        helloExtension = await extensions.findItem(`@installed ${pjson.displayName}`) as ExtensionsViewItem;
    });

    it('Check the extension info', async () => {
        // now we have the extension item, we can check it shows all the fields we want
        const author = await helloExtension.getAuthor();
        const desc = await helloExtension.getDescription();
        const version = await helloExtension.getVersion();

        // in this case we are comparing the results against the values in package.json
        expect(author).equals(pjson.publisher);
        expect(desc).equals(pjson.description);
        expect(version).equals(pjson.version);
    });
});