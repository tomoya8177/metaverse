import { Auth } from '$lib/backend/auth.js';
import { createInsertData } from '$lib/backend/createInsertData.js';
import { createUpdateQuery } from '$lib/backend/createUpdateQuery.js';
import { db } from '$lib/backend/db.js';
import { createFiltersFromParams } from '../../../lib/backend/createFiltersFromParams.js';

export async function GET({ request, params, cookies }) {
	const checkResult = await Auth.check(cookies.get('login'));
	if (!checkResult.result) {
		return new Response('not authorized', { status: 401 });
	}
	const filter = await createFiltersFromParams(request, params, checkResult);
	const rows = await db.query(`select * from ${params.tableName} where ${filter}`);
	return new Response(JSON.stringify(rows));
}

export async function POST({ request, params, cookies }) {
	if (!(await Auth.check(cookies.get('login'))).result) {
		return new Response('not authorized', { status: 401 });
	}
	const id = crypto.randomUUID();
	const body = await request.json();
	if (!body.id) body.id = id;
	const data = await createInsertData(params, body, id);
	const result = await db.query(`insert ${params.tableName} set ${data}`);
	if (result.affectedRows > 0) {
		const rows = await db.query(`select * from ${params.tableName} where id='${body.id}'`);
		return new Response(JSON.stringify(rows[0]));
	}
	return new Response(JSON.stringify([]));
}

export async function DELETE({ request, params, cookies }) {
	const checkResult = await Auth.check(cookies.get('login'));
	if (!checkResult.result) {
		return new Response('not authorized', { status: 401 });
	}
	const filter = await createFiltersFromParams(request, params, checkResult);
	if (!filter) return new Response(JSON.stringify(null));
	const result = await db.query(`delete from ${params.tableName} where ${filter}`);
	return new Response(JSON.stringify(result.affectedRows));
}
