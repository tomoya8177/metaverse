import { apiCall } from '$lib/frontend/Classes/APICall.js';
import axios from 'axios';

export const load = async ({ params }) => {
	let attendances = [];
	const event = (await apiCall.getOne('/api/events?object=' + params.objectId)) || null;
	if (event) {
		attendances = await apiCall.get('/api/attendances?event=' + event.id);
	}
	return {
		event,
		attendances
	};
};
