import { expect } from 'chai';
import * as cb from 'clipboardy';

describe('System clipboard', function () {
    it('Should contains same text as before tests were run', function () {
        const clipboard = cb.readSync();
        expect(clipboard.startsWith('hello_ExTester'), `Fail, the clipboard is: '${clipboard}'`).to.be.true;
    });
});