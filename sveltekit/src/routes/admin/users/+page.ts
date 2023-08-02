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
	return {
		users,
		userRoles,
		organizations
	};
};
