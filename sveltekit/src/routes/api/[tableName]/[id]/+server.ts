import { Auth } from '$lib/backend/auth.js';
import { createUpdateQuery } from '$lib/backend/createUpdateQuery.js';
import { db } from '$lib/backend/db.js';

export async function GET({ params, cookies, request }) {
	const isLocalhost = request.headers.get('host') === 'localhost';

	if (!isLocalhost && !(await Auth.check(cookies.get('login'))).result) {
		//return new Response('not authorized', { status: 401 });
	}
	console.log(`select * from ${params.tableName} where id='${params.id}'`);
	const rows = await db.query(`select * from ${params.tableName} where id='${params.id}'`);

	return new Response(JSON.stringify(rows[0]));
}

export async function PUT({ request, params, cookies }) {
	const isLocalhost = request.headers.get('host') === 'localhost';
	if (isLocalhost && !(await Auth.check(cookies.get('login'))).result) {
		return new Response('not authorized', { status: 401 });
	}
	const updates = await createUpdateQuery(request, params);
	console.log({ updates });
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
	const rows = await db.query(`delete from ${params.tableName} where id='${params.id}'`);
	return new Response(JSON.stringify(rows.affectedRows));
}
