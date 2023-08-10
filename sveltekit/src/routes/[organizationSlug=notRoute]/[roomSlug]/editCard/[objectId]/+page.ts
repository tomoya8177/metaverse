import axios from 'axios';

export const load = async ({ params }) => {
	const event =
		(await axios.get('/api/events?object=' + params.objectId).then((res) => res.data[0])) || null;
	console.log({ event });
	return {
		event
	};
};
