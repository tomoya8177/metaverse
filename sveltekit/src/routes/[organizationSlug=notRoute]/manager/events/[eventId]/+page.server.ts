import { db } from '$lib/backend/db.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const event = (await db.query(`SELECT * FROM events WHERE id ='${params.eventId}'`))[0];
	let object = undefined;
	let room = undefined;
	if (event.object) {
		object = await db
			.query(`SELECT * FROM objects WHERE id ='${event.object}'`)
			.then((res) => res[0]);
		if (!object) {
			event.object = '';
			object = undefined;
			room = undefined;
		} else {
			room = await db.query(`SELECT * FROM rooms WHERE id ='${object.room}'`).then((res) => res[0]);
		}
	}

	return {
		object,
		event,
		room
	};
};
