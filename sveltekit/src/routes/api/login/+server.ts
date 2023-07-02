import { Auth } from '$lib/backend/auth.js';

export async function GET({ request, cookies }): Promise<Response> {
	console.log('checking');
	const result = await Auth.check(cookies.get('login'));
	console.log({ result });
	if (!result.result) {
		return new Response(JSON.stringify({ result: false }));
	}
	return new Response(JSON.stringify(result));
}

export async function POST({ request }): Promise<Response> {
	const body = await request.json();
	console.log({ email: body.email, password: body.password });
	const result = await Auth.find(body.email);
	if (result.result && result.user) {
		const login = await Auth.mark(result.user.id);
		return new Response(JSON.stringify({ ...result, login: login }));
	}
	return new Response(JSON.stringify(result));
}

export const DELETE = async ({ cookies }): Promise<Response> => {
	await Auth.logout(cookies.get('login'));
	return new Response(JSON.stringify({ result: true }));
};
