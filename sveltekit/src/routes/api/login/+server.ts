import { Auth } from '$lib/backend/auth.js';

export async function GET({ request, cookies }): Promise<Response> {
	const result = await Auth.check(cookies.get('login'));
	if (!result.result) {
		return new Response(JSON.stringify({ result: false }));
	}
	return new Response(JSON.stringify(result));
}

export async function POST({ request }): Promise<Response> {
	const body = await request.json();
	const result = await Auth.find(body.email);
	if (result.result && result.user) {
		const login = await Auth.mark(result.user.id);
		return new Response(JSON.stringify({ ...result, login: login }));
	}
	return new Response(JSON.stringify(result));
}

export const DELETE = async ({ cookies }): Promise<Response> => {
	return new Response(JSON.stringify({ result: true }));
};
