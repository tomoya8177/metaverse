import type { RouteParams } from '../../routes/$types';
import { db } from './db';

export const createFiltersFromParams = async (
	request: Request,
	params: any,
	checkResult
): Promise<string> => {
	const { searchParams } = new URL(request.url);

	const fields = await db.fields(params.tableName);
	const filters = [];
	for (const [key, value] of searchParams.entries()) {
		const field = fields.find((f) => f.Field == key);
		if (field) {
			if (value.indexOf('like:') == 0) {
				filters.push(`${key} like '%${value.substring(5)}%'`);
				continue;
			}
			if (value.indexOf('gt:') == 0) {
				filters.push(`${key} > '${value.substring(3)}'`);
				continue;
			}
			if (value.indexOf('lt:') == 0) {
				filters.push(`${key} < '${value.substring(3)}'`);
				continue;
			}
			if (value.indexOf('gte:') == 0) {
				filters.push(`${key} >= ${value.substring(4)}`);
				continue;
			}
			if (value.indexOf('lte:') == 0) {
				filters.push(`${key} <= ${value.substring(4)}`);
				continue;
			}
			if (value.indexOf('ne:') == 0) {
				filters.push(`${key} != '${value.substring(3)}'`);
				continue;
			}
			if (value.indexOf('in:') == 0) {
				filters.push(`${key} in (${value.substring(3)})`);
				continue;
			}
			if (value.indexOf('nin:') == 0) {
				filters.push(`${key} not in (${value.substring(4)})`);
				continue;
			}

			filters.push(`${key}='${value}'`);
		}
	}
	let filter = filters.join(' and ');
	if (!filter) filter = '1';
	//if orderBy is set
	if (searchParams.get('orderBy')) {
		const orderBy = searchParams.get('orderBy');
		const order = searchParams.get('order') || 'asc';
		filter += ` order by ${orderBy} ${order}`;
	}
	//if limit is set
	if (searchParams.get('limit')) {
		const limit = searchParams.get('limit');
		const offset = searchParams.get('offset') || 0;
		filter += ` limit ${offset},${limit}`;
	}
	return filter;
};
