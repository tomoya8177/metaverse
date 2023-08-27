import { db } from '$lib/backend/db.js';
import { Event } from '$lib/frontend/Classes/Event.js';

export const load = async ({ params, parent }) => {
	const { organization, user } = await parent();
	console.log({ organization, user });
	let events = [];
	if (user) {
		events = await db.query(`SELECT * FROM events WHERE organization='${organization.id}'`);

		const attendances = await db.query(
			`SELECT * FROM attendances WHERE event in ('${events
				.map((event) => event.id)
				.join("','")}') and user='${user.id}'`
		);
		events = events
			.map((event) => {
				event.myAttendance = attendances.find((attendance) => attendance.event == event.id);
				return event;
			})
			.filter((event) => event.myAttendance);
	} else {
	}
	return {
		events
	};
};
