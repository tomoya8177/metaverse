import { Auth } from '$lib/backend/auth.js';
import { createUpdateQuery } from '$lib/backend/createUpdateQuery.js';
import { db } from '$lib/backend/db.js';
import { isLocalhost } from '$lib/backend/isLocalhost.js';
import { unlink } from 'fs/promises';

export async function GET({ params, cookies, request }) {
	if (
		!isLocalhost(request.headers.get('host')) &&
		!(await Auth.check(cookies.get('login'))).result
	) {
		//return new Response('not authorized', { status: 401 });
	}
	const rows = await db.query(`select * from ${params.tableName} where id='${params.id}'`);

	return new Response(JSON.stringify(rows[0]));
}

export async function PUT({ request, params, cookies }) {
	if (
		!isLocalhost(request.headers.get('host')) &&
		!(await Auth.check(cookies.get('login'))).result
	) {
		return new Response('not authorized', { status: 401 });
	}
	const updates = await createUpdateQuery(request, params);
	const result = await db.query(
		`update ${params.tableName} set ${updates} where id='${params.id}'`
	);
	if (result.affectedRows > 0) {
		const rows = await db.query(`select * from ${params.tableName} where id='${params.id}'`);
		return new Response(JSON.stringify(rows[0]));
	}
	return new Response(JSON.stringify(null));
}

export async function DELETE({ params, cookies }) {
	if (!(await Auth.check(cookies.get('login'))).result) {
		return new Response('not authorized', { status: 401 });
	}
	if (!params.id) {
		return new Response(JSON.stringify(null));
	}
	if (params.tableName == 'documentsForAI') {
		//delete actual files
		const rows = await db.query(`select * from ${params.tableName} where id='${params.id}'`);
		for (let i = 0; i < rows.length; i++) {
			//elete local file without Deno
			const filePath = './static/documentsForAI/' + rows[i].filename;
			console.log({ filePath });
			const res = await unlink(filePath);
			console.log({ res });
		}
	}
	const rows = await db.query(`delete from ${params.tableName} where id='${params.id}'`);
	return new Response(JSON.stringify(rows.affectedRows));
}
