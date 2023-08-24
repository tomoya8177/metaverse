// import type { User } from '$lib/frontend/Classes/User.js';
import { checkLoginOnServer } from '$lib/backend/checkLoginOnServer.js';
import { db } from '$lib/backend/db.js';
import { User } from '$lib/frontend/Classes/User.js';
import { UserStore } from '$lib/store.js';
import type { Organization } from '$lib/types/Organization.js';
import type { UserRole } from '$lib/types/UserRole.js';

export const load = async ({ params, cookies }) => {
	const organization: Organization = await db
		.query(`SELECT * FROM organizations WHERE slug='${params.organizationSlug}'`)
		.then((res) => res[0]);
	console.log({ organization });
	const { loggedIn, user } = await checkLoginOnServer(cookies.get('login') || '');
	console.log({ loggedIn, user });
	const userRoles = await db
		.query(`SELECT * FROM userRoles WHERE organization='${organization.id}'`)
		.then((res) => res);
	if (loggedIn && typeof user != 'undefined') {
		const userRole = userRoles.find((userRole) => userRole.user == user.id);
		if (userRole) {
			user.userRole = userRole;
		}
	}

	return {
		organization,
		userRoles,
		user,
		// users,
		loggedIn
	};
};
