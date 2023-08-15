// import type { User } from '$lib/frontend/Classes/User.js';
import { User } from '$lib/frontend/Classes/User.js';
import { checkLogin } from '$lib/frontend/checkLogin.js';
import { UserStore } from '$lib/store.js';
import type { Organization } from '$lib/types/Organization.js';
import type { UserRole } from '$lib/types/UserRole.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const organization: Organization = await axios
		.get('/api/organizations?slug=' + params.organizationSlug)
		.then((res) => res.data[0]);
	const { loggedIn, user } = await checkLogin();
	console.log({ loggedIn, user });
	if (loggedIn && typeof user != 'undefined') {
		const userRole = await axios
			.get(`/api/userRoles?organization=${organization.id}&user=${user.id}`)
			.then((res) => res.data[0]);
		if (userRole) {
			user.userRole = userRole;
			UserStore.update((user) => {
				user.userRole = userRole;
				user.isMember = true;
				if (userRole.role == 'manager') {
					user.isManager = true;
				}
				return user;
			});
		}
	}
	console.log({ organization });
	const userRoles = await axios
		.get('/api/userRoles?organization=' + organization.id)
		.then((res) => res.data);
	console.log({ userRoles });

	return {
		organization,
		userRoles,
		// users,
		loggedIn
	};
};
