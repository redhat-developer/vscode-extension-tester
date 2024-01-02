describe('CLI blob order test - 1', function() {
    it('Executed as last test', function() {
        chai.expect(process.env['CLI_ORDER'], 'this test should executed after order-2-test.ts').equal('2');
        process.env['CLI_ORDER'] = '1';
    });
});
