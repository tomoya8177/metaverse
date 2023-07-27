import type { Organization } from '$lib/types/Organization';
import axios from 'axios';

export const checkSlugForOrganization = async (slug: string, organization: Organization) => {
	const result = await axios.get('/api/organizations?slug=' + slug).then((res) => res.data);
	if (result.length && result[0].id != organization.id) {
		alert('Slug already exists');
		return false;
	}
	return true;
};
