import type { Organization } from '$lib/types/Organization';
import axios from 'axios';

export const organizationFromSlug = async (slug: string): Promise<Organization> => {
	return await axios.get('/api/organizations?slug=' + slug).then((res) => res.data[0]);
};
