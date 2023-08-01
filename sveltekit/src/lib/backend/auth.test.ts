import { Auth } from '$lib/backend/auth';
import { describe, expect, it } from 'vitest';
describe('auth test', () => {
	it('should return false for no login', async () => {
		const res = await Auth.check();
		expect(res.result).toBe(false);
	});
	it('should return false for invalid login', async () => {
		const res = await Auth.check('invalid@hahaha.com');
		expect(res.result).toBe(false);
		expect(res.user).toBe(null);
	});
	it('should return a user when logging in with correct email', async () => {
		const res = await Auth.find('imai@narra.jp');
		expect(res.result).toBe(true);
		expect(res.user).toBeDefined();
		it('should return a token for a user', async () => {
			const res2 = await Auth.mark(res.user?.id || '');
			expect(res2).toBeDefined();
			expect(res2.length).toBeGreaterThan(100);
			it('should return a user when logging in with correct token', async () => {
				const res3 = await Auth.check(res2);
				expect(res3.result).toBe(true);
				expect(res3.user).toBeDefined();
			});
		});
	});
	it('should return a token when marking a user', async () => {
		const res = await Auth.mark('1');
		expect(res).toBeDefined();
		expect(res.length).toBeGreaterThan(100);
	});
});
