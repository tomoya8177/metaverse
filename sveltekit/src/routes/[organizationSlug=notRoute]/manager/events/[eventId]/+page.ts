import axios from 'axios';

export const load = async ({ params }) => {
	const event = (await axios.get('/api/events/' + params.eventId).then((res) => res.data)) || null;
	let object = undefined;
	let room = undefined;
	if (event.object) {
		object = await axios.get('/api/objects/' + event.object).then((res) => res.data);
		if (!object) {
			event.object = '';
			object = undefined;
			room = undefined;
		} else {
			room = await axios.get('/api/rooms/' + object.room).then((res) => res.data);
		}
	}

	return {
		object,
		event,
		room
	};
};
