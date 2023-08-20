import { DateTime } from 'luxon';
export const GET = () => {
	return new Response(DateTime.now().toISO());
};
