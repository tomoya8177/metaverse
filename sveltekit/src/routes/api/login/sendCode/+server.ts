import { Auth } from '$lib/backend/auth.js';
import { db } from '$lib/backend/db.js';
import axios from 'axios';
import { port } from '$env/static/private';
import { nl2br } from 'mymetaverse-helper';
export async function POST({ request }): Promise<Response> {
	const body = await request.json();
	const users = await db.query(`select * from users where email='${body.email}'`);
	if (users.length == 0)
		return new Response(JSON.stringify({ result: false, user: null, persona: null }));

	const code = Math.floor(Math.random() * 899999) + 100000;
	await db.query(`update users set verificationCode='${code}' where id='${users[0].id}'`);
	const user = users[0];

	const result = await axios.post(`http://localhost:${port}/api/email`, {
		to: user.email, // list of receivers
		subject: body.subject, // Subject line
		body: body.emailBody.replace('[[code]]', code),
		html: body.emailBodyHTML.replace('[[code]]', code)
	});
	return new Response(JSON.stringify(result.data));
}
