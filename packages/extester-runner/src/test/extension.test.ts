describe('Main describe only', function () {
	describe.skip('Nested describe skip', () => {
		it.only('individual test only ', async function () {});
		it.skip('individual test skip', async function () {});
		describe.only('nested describe inside describe ', function () {
			it('individual test', async function () {});
		});
		it('individual test', async function () {});
	});
	describe('Main describe - nothing inside', function () {});
});
