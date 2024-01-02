describe('CLI blob order test - 3', function() {
    it('Executed as first test', function() {
        chai.expect(process.env['CLI_ORDER'], `other test was executed first`).to.be.undefined;
        process.env['CLI_ORDER'] = '3';
    });
});
