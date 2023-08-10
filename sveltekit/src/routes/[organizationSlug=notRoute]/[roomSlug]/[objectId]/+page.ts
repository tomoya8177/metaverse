import axios from 'axios';

export const load = async ({ params }) => {
	let attendances = [];
	const event =
		(await axios.get('/api/events?object=' + params.objectId).then((res) => res.data[0])) || null;
	if (event) {
		attendances = await axios.get('/api/attendances?event=' + event.id).then((res) => res.data);
	}
	return {
		event,
		attendances
	};
};
