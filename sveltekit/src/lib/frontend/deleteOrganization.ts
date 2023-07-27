import type { Organization } from '$lib/types/Organization';
import axios from 'axios';
export const deleteOrganization = async (organization: Organization) => {
	await axios.delete('/api/organizations/' + organization.id).then((res) => res.data);
	await axios.delete('/api/userRoles?organization=' + organization.id).then((res) => res.data);
	const deletedEvents = await axios
		.delete('/api/events?organization=' + organization.id)
		.then((res) => res.data);
	console.log({ deletedEvents });
	await axios.delete('/api/mentors?organization=' + organization.id).then((res) => res.data);
	await axios.delete('/api/sessions?organization=' + organization.id).then((res) => res.data);
};
