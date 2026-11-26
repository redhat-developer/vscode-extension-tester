context('Context suite', () => {
	specify('Specify test', () => {});
	xit('Skipped it', () => {});
	xspecify('Skipped specify', () => {});
	context.only('Nested context', () => {
		specify.skip('Skipped nested specify', () => {});
	});
});

xdescribe('Skipped describe', () => {
	it.retries(2);
	it('Test of skipped describe', () => {});
});
