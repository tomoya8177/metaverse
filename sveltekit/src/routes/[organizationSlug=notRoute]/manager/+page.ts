import type { User } from '$lib/frontend/Classes/User.js';
import type { ActionHistory } from '$lib/types/ActionHistory.js';
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
	const actionHistories = actions.map((actionHistory: ActionHistory) => {
		actionHistory.param = '';
		actionHistory.userData = users.find((user: User) => user.id == actionHistory.user);
		if (actionHistory.action == 'visit') {
			actionHistory.param = JSON.parse(actionHistory.data).path;
		}
		return actionHistory;
	});
	console.log({ organization });
	return {
		organization,
		actionHistories
	};
};
