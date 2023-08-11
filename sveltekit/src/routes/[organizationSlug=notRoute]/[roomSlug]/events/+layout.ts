import type { Event } from '$lib/frontend/Classes/Event';
import axios from 'axios';

export const load = async ({ params }) => {
	const organization = await axios
		.get('/api/organizations?slug=' + params.organizationSlug)
		.then((res) => res.data[0]);
	const events = await axios
		.get('/api/events?organization=' + organization.id)
		.then((res) => res.data);
	const attendances = await axios
		.get(`/api/attendances?event=in:'${events.map((event: Event) => event.id).join("','")}'`)
		.then((res) => res.data);
	return {
		events,
		attendances
	};
};
