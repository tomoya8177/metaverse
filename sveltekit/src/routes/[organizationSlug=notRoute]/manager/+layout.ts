import { PUBLIC_API_ENDPOINT } from '$env/static/public';
import { apiCall } from '$lib/frontend/Classes/APICall.js';
import type { Organization } from '$lib/types/Organization';
import axios from 'axios';
export const load = async ({ params, parent }) => {
	const { organization, userRoles } = await parent();

	const users = await apiCall.get(
		`/api/users?id=in:'${userRoles.map((role) => role.user).join("','")}'`
	);
	const rooms = await apiCall.get('/api/rooms?organization=' + organization.id);
	return {
		organization,
		users,
		rooms
	};
};
