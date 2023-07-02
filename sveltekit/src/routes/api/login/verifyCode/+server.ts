import { Auth } from '$lib/backend/auth.js';
import { db } from '$lib/backend/db.js';

export const POST = async ({ request, params, cookies }) => {
	const body = await request.json();
	const users = await db.query(
		`select * from users where email='${body.email}' and verificationCode='${body.code}'`
	);
	if (users.length == 0) {
		//login failed
		return new Response(JSON.stringify({ result: false, user: null, persona: null }));
	}
	const user = users[0];
	const login = await Auth.mark(user.id);
	const result = {
		result: true,
		user,
		persona: null
	};
	return new Response(JSON.stringify({ ...result, login: login }));
};
