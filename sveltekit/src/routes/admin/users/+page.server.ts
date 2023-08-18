import { User } from '$lib/frontend/Classes/User';
import { fillOrganization } from './fillOrganization';
import { db } from '$lib/backend/db';

export const load = async () => {
	const userRoles = await db.query(`select * from userRoles`).then((res) => res);
	const organizations = await db.query(`select * from organizations`).then((res) => res);
	let users = await db.query(`select * from users where email!='' order by createdAt desc`);
	users = users.map((user: User) => {
		user = fillOrganization(user, userRoles, organizations);
		return new User(user);
	});
	const promises = users.map((user) => {
		return db.query(
			`select * from actions where user='${user.id}' order by createdAt desc limit 1`
		);
	});
	const sessions = await Promise.all(promises);
	sessions.forEach((lastSession) => {
		if (!lastSession) return;
		const user = users.find((user) => user.id == lastSession.user);
		if (!user) return;
		user.lastSession = lastSession;
	});
	users = users.sort((a, b) => (a.lastSession?.createdAt < b.lastSession?.createdAt ? 1 : -1));
	return {
		users: users.map((user) => user.purifyData()),
		userRoles,
		organizations
	};
};
