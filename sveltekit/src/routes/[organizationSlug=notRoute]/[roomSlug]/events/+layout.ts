import { apiCall } from '$lib/frontend/Classes/APICall.js';
import type { Event } from '$lib/frontend/Classes/Event';
import axios from 'axios';

export const load = async ({ params, parent }) => {
	const { organization } = await parent();

	const events = await apiCall.get('/api/events?organization=' + organization.id);

	const attendances = await apiCall.get(
		`/api/attendances?event=in:'${events.map((event: Event) => event.id).join("','")}'`
	);

	return {
		events,
		attendances
	};
};
