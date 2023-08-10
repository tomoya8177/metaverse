import axios from 'axios';

export const load = async ({ params }) => {
	const object = await axios.get('/api/objects/' + params.objectId).then((res) => res.data);
	const event =
		(await axios.get('/api/events?object=' + params.objectId).then((res) => res.data[0])) || null;
	return {
		object,
		event
	};
};
