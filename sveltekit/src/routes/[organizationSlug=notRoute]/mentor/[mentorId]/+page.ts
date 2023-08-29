import { apiCall } from '$lib/frontend/Classes/APICall.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const mentor = await apiCall.get('/api/mentors/' + params.mentorId);
	console.log({ mentor });
	mentor.userData = await apiCall.getOne('/api/users/' + mentor.user);
	//await axios.get('/mentor/' + mentor.id);
	return {
		mentor
	};
};
