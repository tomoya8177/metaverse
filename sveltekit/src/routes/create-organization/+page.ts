import { checkLogin } from '$lib/frontend/checkLogin.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const { loggedIn, user } = await checkLogin();
	const slug = crypto.randomUUID();
	const id = crypto.randomUUID();

	return {
		loggedIn,
		user
	};
};
