import { db } from '$lib/backend/db.js';

export async function POST({ request }): Promise<Response> {
	const body = await request.json();
	console.log({ email: body.email, nickname: body.nickname, organization: body.organization });
	const id = crypto.randomUUID();
	const result = await db.query(
		`insert users set email='${body.email}', nickname='${body.email
			.split('@')
			.shift()}', id='${id}'`
	);
	if (body.organization) {
		await db.query(`insert userRoles set user='${id}', organization='${body.organization}'`);
	}
	return new Response(JSON.stringify(result));
}
