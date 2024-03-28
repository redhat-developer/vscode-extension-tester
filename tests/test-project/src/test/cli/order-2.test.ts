import { expect } from "chai";

describe('CLI blob order test - 2', function() {
    it('Executed as middle test', function() {
        expect(process.env['CLI_ORDER'], 'this test should executed after order-3.test.ts').equal('3');
        process.env['CLI_ORDER'] = '2';
    });
});
