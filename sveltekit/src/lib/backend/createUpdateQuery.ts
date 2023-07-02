import { db } from './db';
import { fixBoolean } from './fixBoolean';

export const createUpdateQuery = async (request: Request, params: any): Promise<string> => {
	const body = await request.json();
	const updates = [];
	const fields = await db.fields(params.tableName);

	for (const field of fields) {
		if (body[field.Field] === undefined) continue;
		if (
			(field.Type.includes('int') || field.Type.includes('varchar') || field.Type == 'text') &&
			field.Null == 'NO' &&
			!body[field.Field] &&
			field.Field != 'id' &&
			field.Default == null
		) {
			body[field.Field] = field.Type.includes('int') ? 0 : '';
		}
		if (field.Type == 'date' && !body[field.Field]) {
			body[field.Field] = null;
		}
		if (field.Type == 'datetime' && !body[field.Field]) {
			body[field.Field] = null;
		}
		if (field.Type.includes('tinyint')) {
			body[field.Field] = fixBoolean(body[field.Field]);
		}
	}
	for (let [key, value] of Object.entries(body)) {
		if (!fields.some((field) => field.Field == key)) continue;
		if (key == 'id' || key == 'ai') continue;
		if (value === null || typeof value === 'undefined') continue;
		if (value.toString().includes('.000Z')) value = value.toString().replace('.000Z', '');
		updates.push(`${key}='${value}'`);
	}
	return updates.join(',');
};
