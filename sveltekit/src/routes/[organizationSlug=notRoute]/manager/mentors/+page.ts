import { apiCall } from '$lib/frontend/Classes/APICall.js';
import axios from 'axios';

export const load = async ({ params, parent }) => {
	const { organization } = await parent();

	const mentors = await apiCall.get('/api/mentors?organization=' + organization.id);
	return {
		mentors
	};
};
