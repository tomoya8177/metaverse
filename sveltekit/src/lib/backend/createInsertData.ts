import { db } from './db';
import { fixBoolean } from './fixBoolean';

export const createInsertData = async (params: any, body, id: string): Promise<string> => {
	const fields = await db.fields(params.tableName);
	for (const field of fields) {
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
	const data = [];
	for (const [key, value] of Object.entries(body)) {
		if (!fields.some((field) => field.Field == key)) continue;
		if (key == 'ai') continue;
		if (key == 'id' && !value) continue;
		if (value === null) {
			continue;
		}
		data.push(`${key}='${value}'`);
	}
	if (!body.id) {
		data.push(`id='${id}'`);
	}
	return data.join(',');
};
