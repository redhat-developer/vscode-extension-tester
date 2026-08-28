module.exports = {
	// CI runners (especially macOS) can be 4-5x slower than average, and the
	// page objects' internal condition waits legitimately need 10-30s there.
	// A 10s global budget made every such test a timing lottery on slow
	// machines - individual tests still override this where they need more.
	timeout: 30000,
	failZero: true,
};
