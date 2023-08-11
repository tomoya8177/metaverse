import { checkLogin } from '$lib/frontend/checkLogin.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const { loggedIn, user } = await checkLogin();
	const organization = await axios
		.post('/api/organizations', {
			slug: crypto.randomUUID()
		})
		.then((res) => res.data);

	return {
		loggedIn,
		user,
		organization
	};
};
