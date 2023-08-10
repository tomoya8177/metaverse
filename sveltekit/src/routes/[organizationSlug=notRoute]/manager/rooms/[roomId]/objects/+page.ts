import { SharedObject } from '$lib/frontend/Classes/SharedObject.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const objects = await axios
		.get('/api/objects?room=' + params.roomId + '&orderBy=lockedPosition')
		.then((res) => res.data);
	return {
		objects
	};
};
