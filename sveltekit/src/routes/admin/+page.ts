import { apiCall } from '$lib/frontend/Classes/APICall.js';
import type { User } from '$lib/frontend/Classes/User.js';
import type { Organization } from '$lib/types/Organization.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const users = await apiCall.get('/api/users');
	const actions = await apiCall.get(
		`/api/actions?orderBy=createdAt&user=nin:'${users
			.filter((user) => user.isAdmin)
			.map((user) => user.id)
			.join("','")}'&order=desc&limit=100`
	);

	const rooms = await apiCall.get('/api/rooms');
	const actionHistories = actions.map((action) => {
		action.userData = users.find((user: User) => user.id == action.user);
		action.roomData = rooms.find((room) => room.id == action.room) || null;
		try {
			action.dataData = JSON.parse(action.data);
		} catch (error) {}
		return action;
	});
	return {
		actionHistories
	};
};
