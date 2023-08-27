import { checkLogin } from '$lib/frontend/checkLogin';

export const load = async () => {
	const { loggedIn, user } = await checkLogin();
	return {
		loggedIn,
		user
	};
};
