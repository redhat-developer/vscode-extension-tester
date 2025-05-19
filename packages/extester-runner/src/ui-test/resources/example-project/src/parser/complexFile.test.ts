describe('Root suite modifier: no parentModifier: no', () => {
	it('Root test 1 modifier: no parentModifier: no', () => {});
	it.skip('Root test 2 modifier: skip parentModifier: no', () => {});
	it.only('Root test 3 modifier: only parentModifier: no', () => {});

	describe.only('Child suite modifier: only parentModifier: no', () => {
		it('Child test 1 modifier: no parentModifier: only', () => {});
		it.skip('Child test 2 modifier: skip parentModifier: only', () => {});
		it('Child test 3 modifier: no parentModifier: only', () => {});
		it.only('Child test 4 modifier: only parentModifier: only', () => {});

		describe('Grandchild suite 1 modifier: no parentModifier: only', () => {
			it('Grandchild suite 1 test 1 modifier: no parentModifier: only', () => {});
			it.skip('Grandchild suite 1 test 2 modifier: skip parentModifier: only', () => {});
			it('Grandchild suite 1 test 3 modifier: no parentModifier: only', () => {});
			it.only('Grandchild suite 1 test 4 modifier: only parentModifier: only', () => {});
			it('Grandchild suite 1 test 5 modifier: no parentModifier: only', () => {});
		});

		describe.skip('Grandchild suite 2 modifier: skip parentModifier: only', () => {
			it('Grandchild suite 2 test 1 modifier: no parentModifier: skip', () => {});
			it.skip('Grandchild suite 2 test 2 modifier: skip parentModifier: skip', () => {});
			it('Grandchild suite 2 test 3 modifier: no parentModifier: skip', () => {});
			it.only('Grandchild suite 2 test 4 modifier: only parentModifier: skip', () => {});
			it('Grandchild suite 2 test 5 modifier: no parentModifier: skip', () => {});
			it('Grandchild suite 2 test 6 modifier: no parentModifier: skip', () => {});
		});
	});
});
