import * as ics from 'ics';
import { writeFileSync } from 'fs';
import { DateTime } from 'luxon';
export const POST = async ({ request }) => {
	const body = await request.json();

	const start = DateTime.fromISO(body.event.start);
	const end = DateTime.fromISO(body.event.end);
	const duration = end.diff(start, ['days', 'hours', 'minutes']).toObject();
	//remove if the value was 0
	for (const key in duration) {
		if (duration[key] == 0) {
			delete duration[key];
		}
	}
	const event = {
		start: [
			Number(start.toFormat('yyyy')),
			Number(start.toFormat('M')),
			Number(start.toFormat('d')),
			Number(start.toFormat('HH')),
			Number(start.toFormat('m'))
		] as ics.DateArray,
		duration: duration,
		title: body.event.summary,
		description: body.event.description,
		location: body.event.location,
		url: body.event.url
	};
	console.log({ event }, end.diff(start));
	const { error, value } = await ics.createEvent(event);
	if (error) {
		console.log(error);
	}
	writeFileSync(`./statis/icals/${event.title}.ics`, value || '');

	return new Response(JSON.stringify({ filename: `${event.title}.ics` }));
};
