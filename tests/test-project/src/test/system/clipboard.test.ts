import { expect } from 'chai';

describe('System clipboard', function () {
    it('Should contains same text as before tests were run', async function () {
        const cb = await import('clipboardy');
        const clipboard = cb.default.readSync();
        expect(clipboard.startsWith('hello_ExTester'), `Fail, the clipboard is: '${clipboard}'`).to.be.true;
    });
});