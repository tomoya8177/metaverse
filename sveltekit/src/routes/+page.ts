import { checkLogin } from '$lib/frontend/checkLogin.js';

export const load = async ({ page, fetch }) => {
	const { loggedIn, user } = await checkLogin();
	return {
		loggedIn,
		user
	};
};
