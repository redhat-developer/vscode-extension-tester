import * as assert from 'assert';
import * as path from 'path';
import { before } from 'vscode-extension-tester';

describe(path.basename(__filename, '.js'), function () {
    before('Hook under test', function () {
        throw new Error('Take a screenshot.');
    });
    it('Hello world', function () {
        assert.ok(true);
    });
});
