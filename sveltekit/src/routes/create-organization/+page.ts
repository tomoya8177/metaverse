import { checkLogin } from '$lib/frontend/checkLogin.js';

export const load = async ({ params }) => {
	const { loggedIn, user } = await checkLogin();
	return {
		loggedIn,
		user
	};
};
