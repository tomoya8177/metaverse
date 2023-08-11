import axios from 'axios';

export const load = async ({ params }) => {
	const event = await axios.get('/api/events/' + params.eventId).then((res) => res.data);
	return {
		event
	};
};
