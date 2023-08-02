import axios from 'axios';

export const load = async () => {
	const organizations = await axios
		.get('/api/organizations?orderBy=createdAt&order=desc')
		.then((res) => res.data);
	return {
		organizations: organizations
	};
};
