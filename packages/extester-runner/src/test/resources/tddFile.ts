suite('Calculator', () => {
	suiteSetup(() => {});
	setup(() => {});
	test('adds', () => {});
	test.skip('subtracts', () => {});

	suite.only('Advanced', () => {
		test('multiplies', () => {});
		test.only('divides', () => {});
	});
	teardown(() => {});
});

suite.skip('Strings', () => {
	test('concatenates', () => {});
});
