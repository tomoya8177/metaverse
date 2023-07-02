import { db } from '$lib/backend/db.js';
import axios from 'axios';

export async function POST({ request }): Promise<Response> {
	const body = await request.json();
	const result = await db.query(`select * from users where email='${body.email}'`);
	return new Response(JSON.stringify(result));
}
