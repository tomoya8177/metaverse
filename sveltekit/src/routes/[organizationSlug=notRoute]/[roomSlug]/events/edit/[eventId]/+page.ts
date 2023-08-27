import { apiCall } from '$lib/frontend/Classes/APICall.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const event = await apiCall.get('/api/events/' + params.eventId);
	return {
		event
	};
};
