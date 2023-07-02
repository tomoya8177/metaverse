import { db } from '$lib/backend/db.js';

export async function POST({ request }): Promise<Response> {
	const body = await request.json();
	console.log({ email: body.email, nickname: body.nickname });
	const id = crypto.randomUUID();
	const result = await db.query(
		`insert users set email='${body.email}', nickname='${body.email
			.split('@')
			.shift()}', id='${id}'`
	);
	return new Response(JSON.stringify(result));
}
