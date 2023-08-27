import { apiCall } from '$lib/frontend/Classes/APICall.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const mentor = await apiCall.getOne('/api/mentors/' + params.mentorId);
	mentor.userData = await apiCall.getOne('/api/users/' + mentor.user);
	//await axios.get('/mentor/' + mentor.id);
	return {
		mentor
	};
};
