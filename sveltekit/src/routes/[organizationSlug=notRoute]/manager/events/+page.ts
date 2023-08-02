import { Event } from '$lib/frontend/Classes/Event';
import axios from 'axios';

export const load = async ({ params }) => {
	const organization = await axios
		.get('/api/organizations?slug=' + params.organizationSlug)
		.then((res) => res.data[0]);
	const rooms = await axios
		.get('/api/rooms?organization=' + organization.id)
		.then((res) => res.data);

	const events = (await axios
		.get('/api/events?organization=' + organization.id)
		.then((res) => res.data)) as Event[];
	return {
		events: events.map((event) => new Event(event)),
		organization,
		rooms
	};
};
