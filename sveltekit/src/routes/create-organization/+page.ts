import { checkLogin } from '$lib/frontend/checkLogin.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const { loggedIn, user } = await checkLogin();

	return {
		loggedIn,
		user
	};
};
