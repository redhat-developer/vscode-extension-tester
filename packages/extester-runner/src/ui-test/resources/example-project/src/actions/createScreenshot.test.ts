import { assert } from 'chai';
import { VSBrowser } from 'vscode-extension-tester';

describe('Create Screenshot', function () {
	this.timeout(15000);
	it('Trigger takeScreenshot action', async function () {
		await VSBrowser.instance.takeScreenshot('screenshot1');
		await VSBrowser.instance.takeScreenshot('screenshot2');
		assert.isTrue(true);
	});
});
