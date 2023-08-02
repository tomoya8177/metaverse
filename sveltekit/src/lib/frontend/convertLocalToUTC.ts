import { DateTime } from 'luxon';
export const convertLocalToUTC = (date: string) => {
	return DateTime.fromISO(date, {
		zone: 'local'
	})
		.toUTC()
		.toISO();
};
export const convertUTCToLocal = (date: string) => {
	return DateTime.fromISO(date, {
		zone: 'utc'
	})
		.toLocal()
		.toISO();
};
