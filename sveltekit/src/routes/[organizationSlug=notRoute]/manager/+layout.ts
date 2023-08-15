import type { Organization } from '$lib/types/Organization';
import axios from 'axios';

export const load = async ({ params }) => {
	const organization: Organization = await axios
		.get(`/api/organizations?slug=${params.organizationSlug}`)
		.then((res) => res.data[0]);
	const userRoles = await axios
		.get('/api/userRoles?organization=' + organization.id)
		.then((res) => res.data);
	const users = await axios
		.get(`/api/users?id=in:'${userRoles.map((role) => role.user).join("','")}'`)
		.then((res) => res.data);
	const rooms = await axios
		.get('/api/rooms?organization=' + organization.id)
		.then((res) => res.data);
	return {
		organization,
		users,
		rooms
	};
};
