import type { Organization } from '$lib/types/Organization';
import axios from 'axios';
export const deleteOrganization = async (organization: Organization) => {
	await axios.delete('/api/organizations/' + organization.id).then((res) => res.data);
	await axios.delete('/api/userRoles?organization=' + organization.id).then((res) => res.data);
	const deletedRooms = await axios
		.delete('/api/rooms?organization=' + organization.id)
		.then((res) => res.data);
	console.log({ deletedRooms });
	await axios.delete('/api/mentors?organization=' + organization.id).then((res) => res.data);
	await axios.delete('/api/sessions?organization=' + organization.id).then((res) => res.data);
};
