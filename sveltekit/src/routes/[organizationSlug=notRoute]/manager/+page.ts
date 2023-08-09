import type { Room } from '$lib/frontend/Classes/Room.js';
import type { User } from '$lib/frontend/Classes/User.js';
import type { Organization } from '$lib/types/Organization.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const organization: Organization = await axios
		.get(`/api/organizations?slug=${params.organizationSlug}`)
		.then((res) => res.data[0]);
	const actions = await axios
		.get('/api/actions?organization=' + organization.id + '&orderBy=createdAt&order=desc&limit=100')
		.then((res) => res.data);
	const users = await axios.get('/api/users').then((res) => res.data);
	const rooms = await axios
		.get('/api/rooms?organization=' + organization.id)
		.then((res) => res.data);
	const actionHistories = actions.map((action) => {
		action.userData = users.find((user: User) => user.id == action.user);
		action.roomData = rooms.find((room: Room) => room.id == action.room) || null;
		return action;
	});
	return {
		organization,
		actionHistories
	};
};
