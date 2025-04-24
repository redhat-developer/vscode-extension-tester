import { assert } from 'chai';

describe('Create Logs', function () {
	this.timeout(15000);
	it('Create logs file by test failure', async function () {
		assert.isTrue(false);
	});
});
