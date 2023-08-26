import { apiCall } from '$lib/frontend/Classes/APICall.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const event = (await apiCall.getOne('/api/events?object=' + params.objectId)) || null;
	console.log({ event });
	return {
		event
	};
};
