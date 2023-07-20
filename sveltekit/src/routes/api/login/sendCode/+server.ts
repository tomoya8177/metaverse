import { Auth } from '$lib/backend/auth.js';
import { db } from '$lib/backend/db.js';
import axios from 'axios';
import { port } from '$env/static/private';
import { nl2br } from '$lib/math/nl2br.js';
export async function POST({ request }): Promise<Response> {
	const body = await request.json();
	console.log({ email: body.email });
	const users = await db.query(`select * from users where email='${body.email}'`);
	if (users.length == 0)
		return new Response(JSON.stringify({ result: false, user: null, persona: null }));

	const code = Math.floor(Math.random() * 899999) + 100000;
	await db.query(`update users set verificationCode='${code}' where id='${users[0].id}'`);
	const user = users[0];
	const emailBody = `Hello.
  Please return to the login page and input the verification code below:
  ${code}
  
  `;
	const result = await axios.post(`http://localhost:${port}/api/email`, {
		to: user.email, // list of receivers
		subject: 'Confirmation Code', // Subject line
		body: emailBody, // plain text emailBody
		html: nl2br(emailBody) //
	});
	return new Response(JSON.stringify(result.data));
}
