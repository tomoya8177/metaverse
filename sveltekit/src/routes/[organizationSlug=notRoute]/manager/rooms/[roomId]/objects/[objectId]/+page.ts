import { apiCall } from '$lib/frontend/Classes/APICall.js';
import axios from 'axios';

export const load = async ({ params, parent }) => {
	const { objects } = await parent();
	const object = objects.find((object) => object.id === params.objectId) || null;
	const event = (await apiCall.getOne('/api/events?object=' + params.objectId)) || null;
	return {
		object,
		event
	};
};
