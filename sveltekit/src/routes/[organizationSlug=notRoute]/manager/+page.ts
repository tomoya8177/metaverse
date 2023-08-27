import { apiCall } from '$lib/frontend/Classes/APICall.js';
import type { Room } from '$lib/frontend/Classes/Room.js';
import type { User } from '$lib/frontend/Classes/User.js';
import axios from 'axios';

export const load = async ({ params, parent }) => {
	const { organization, users, rooms } = await parent();
	const actions = await apiCall.get(
		'/api/actions?organization=' + organization.id + '&orderBy=createdAt&order=desc&limit=100'
	);

	const actionHistories = actions
		.map((action) => {
			action.userData = users.find((user: User) => user.id == action.user);
			action.roomData = rooms.find((room: Room) => room.id == action.room) || null;
			return action;
		})
		.filter((action) => !action.userData?.isAdmin);
	return {
		organization,
		actionHistories
	};
};
