import { apiCall } from '$lib/frontend/Classes/APICall.js';
import { Event } from '$lib/frontend/Classes/Event';
import axios from 'axios';

export const load = async ({ params, parent }) => {
	const { organization } = await parent();
	const rooms = await apiCall.get('/api/rooms?organization=' + organization.id);

	const events = (await apiCall.get('/api/events?organization=' + organization.id)) as Event[];
	return {
		events: events.map((event) => new Event(event)),
		organization,
		rooms
	};
};
