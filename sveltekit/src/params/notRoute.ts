import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param) => {
	return param != 'admin' && param != 'mentor';
}) satisfies ParamMatcher;
