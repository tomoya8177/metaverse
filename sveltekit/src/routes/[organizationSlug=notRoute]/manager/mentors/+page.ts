import axios from 'axios';

export const load = async ({ params }) => {
	const organization = await axios
		.get('/api/organizations?slug=' + params.organizationSlug)
		.then((res) => res.data[0]);
	const mentors = await axios
		.get('/api/mentors?organization=' + organization.id)
		.then((res) => res.data);
	return {
		mentors
	};
};
