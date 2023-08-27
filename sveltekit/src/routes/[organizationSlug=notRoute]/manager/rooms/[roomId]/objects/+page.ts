import { apiCall } from '$lib/frontend/Classes/APICall.js';
import { SharedObject } from '$lib/frontend/Classes/SharedObject.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const objects = await apiCall.get(
		'/api/objects?room=' + params.roomId + '&orderBy=lockedPosition'
	);
	return {
		objects
	};
};
