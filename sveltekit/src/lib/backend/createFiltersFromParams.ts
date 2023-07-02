import type { RouteParams } from '../../routes/$types';
import { db } from './db';

export const createFiltersFromParams = async (
	request: Request,
	params: any,
	checkResult
): Promise<string> => {
	const { searchParams } = new URL(request.url);
	switch (checkResult.user.category) {
		case 'teacher':
			switch (params.tableName) {
				case 'task_order':
					console.log({ checkResult });
					searchParams.set('instructorId', checkResult.persona.id);
					searchParams.set('status', 'ne:Draft');
					console.log({ searchParams: searchParams.toString() });
					break;
				case 'lesson':
					//searchParams.set('teacher', 'like:' + checkResult.persona.id);
					break;
				case 'class':
					const lessons = await db.query(
						`select class_id from vlt_lesson where teacher like '%${checkResult.persona.id}%'`
					);
					const classIds = lessons.map((l) => l.class_id);
					const classIdsUnique = new Set(classIds);
					searchParams.set('id', 'in:' + [...classIdsUnique].map((id) => `'${id}'`).join(','));
			}

			break;
		case 'admin':
			switch (params.tableName) {
				case 'client':
					searchParams.set('status', 'ne:deleted');
			}
			break;
		case 'internal':
			switch (params.tableName) {
				case 'client':
					{
						const result = await db.query(
							`select client from vlt_class where sales_id like '%${checkResult.persona.id}%'`
						);
						if (!result.length) break;
						searchParams.set('id', 'in:' + result.map((r) => `'${r.client}'`).join(','));
						searchParams.set('status', 'ne:deleted');
					}
					break;
				case 'class':
					searchParams.set('sales_id', 'like:' + checkResult.persona.id);
					break;
				case 'student':
					const result = await db.query(
						`select id from vlt_class where sales_id like '%${checkResult.persona.id}%'`
					);
					if (!result.length) break;
					const studentResults = await db.query(
						`select id from vlt_student where ${result
							.map((r) => `current_class like '%${r.id}%'`)
							.join(' or ')}`
					);
					console.log({ studentResults });
					searchParams.set('id', 'in:' + studentResults.map((r) => `'${r.id}'`).join(','));
			}
	}
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
	return filter;
};
