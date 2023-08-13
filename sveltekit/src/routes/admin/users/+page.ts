import { User } from '$lib/frontend/Classes/User';
import axios from 'axios';
import { fillOrganization } from './fillOrganization';

export const load = async () => {
	const userRoles = await axios.get('/api/userRoles').then((res) => res.data);
	const organizations = await axios.get('/api/organizations').then((res) => res.data);
	let users = await axios
		.get(`/api/users?orderBy=createdAt&order=desc`)
		.then((res) => res.data.filter((user: User) => !!user.email));
	users = users.map((user: User) => {
		user = fillOrganization(user, userRoles, organizations);
		return new User(user);
	});
	const promises = users.map((user) => {
		return axios
			.get('/api/actions?user=' + user.id + '&orderBy=createdAt&order=desc&limit=1')
			.then((res) => res.data[0]);
	});
	const sessions = await Promise.all(promises);
	console.log({ sessions });
	sessions.forEach((lastSession) => {
		if (!lastSession) return;
		const user = users.find((user) => user.id == lastSession.user);
		user.lastSession = lastSession;
	});
	users = users.sort((a, b) => (a.lastSession?.createdAt < b.lastSession?.createdAt ? 1 : -1));
	console.log({ users });
	return {
		users,
		userRoles,
		organizations
	};
};
