import { db } from '$lib/backend/db.js';
import { storedChats } from '$lib/memory/StoredChats.js';

export const POST = async ({ request, params }) => {
	storedChats.resetMentor(params.mentorId);
	console.log({ storedChats });
	return new Response(JSON.stringify({}));
};
