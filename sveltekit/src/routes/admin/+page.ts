import type { User } from '$lib/frontend/Classes/User.js';
import type { Organization } from '$lib/types/Organization.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const organization: Organization = await axios
		.get(`/api/organizations`)
		.then((res) => res.data[0]);
	const actions = await axios
		.get('/api/actions?orderBy=createdAt&order=desc&limit=100')
		.then((res) => res.data);
	const users = await axios.get('/api/users').then((res) => res.data);
	const rooms = await axios.get('/api/rooms').then((res) => res.data);
	const actionHistories = actions.map((action) => {
		action.userData = users.find((user: User) => user.id == action.user);
		action.roomData = rooms.find((room) => room.id == action.room) || null;
		try {
			action.dataData = JSON.parse(action.data);
		} catch (error) {}
		return action;
	});
	console.log({ organization, actionHistories });
	return {
		organization,
		actionHistories
	};
};
