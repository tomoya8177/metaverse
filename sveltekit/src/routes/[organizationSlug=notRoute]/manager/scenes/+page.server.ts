import { apiCall } from '$lib/frontend/Classes/APICall.js';

export const load = async ({ parent }) => {
	const { organization } = await parent();
	console.log({ organization });
	const scenes = await apiCall.get(`/api/xrCloudScenes?organization=${organization.id}`);
	console.log({ scenes });
	return {
		scenes
	};
};
