import { apiCall } from '$lib/frontend/Classes/APICall.js';
import axios from 'axios';

export const load = async ({ params }) => {
	let attendances = [];
	const event =
		(await apiCall.getOne('/api/events?object=' + params.objectId).then((res) => res.data[0])) ||
		null;
	if (event) {
		attendances = await apiCall.get('/api/attendances?event=' + event.id).then((res) => res.data);
	}
	return {
		event,
		attendances
	};
};
