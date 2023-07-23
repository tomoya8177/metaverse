import axios from 'axios';

export const load = async ({ params }) => {
	const objects = await axios.get('/api/objects?event=' + params.eventId).then((res) => res.data);
	return {
		objects
	};
};
