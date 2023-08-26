import { apiCall } from '$lib/frontend/Classes/APICall.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const event = await apiCall.get('/api/events/' + params.eventId);
	let object;
	if (event.object) {
		object = await apiCall.get('/api/objects/' + event.object);
	}
	const attendances = await apiCall.get('/api/attendances?event=' + params.eventId);

	return {
		event,
		attendances,
		object
	};
};
