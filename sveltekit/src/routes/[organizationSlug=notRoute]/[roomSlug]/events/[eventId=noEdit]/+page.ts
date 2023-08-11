import axios from 'axios';

export const load = async ({ params }) => {
	const event = await axios.get('/api/events/' + params.eventId).then((res) => res.data);
	let object;
	if (event.object) {
		object = await axios.get('/api/objects/' + event.object).then((res) => res.data);
	}
	const attendances = await axios
		.get('/api/attendances?event=' + params.eventId)
		.then((res) => res.data);
	return {
		event,
		attendances,
		object
	};
};
