import { db } from '$lib/backend/db';

export const load = async ({ params }) => {
	const event = (await db.query(`SELECT * FROM events WHERE id ='${params.eventId}'`))[0];
	const attendances = await db.query(`SELECT * FROM attendances WHERE event ='${params.eventId}'`);
	console.log({ event });
	return {
		event,
		attendances
	};
};
