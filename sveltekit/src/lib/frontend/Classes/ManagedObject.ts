import type { SharedObject } from './SharedObject';
import { DateTime } from 'luxon';

export class managedObject {
	id?: string;
	object: string;
	objectData?: SharedObject;
	start: string;
	end: string;
	location: string = '';
	summary: string = '';
	description: string = '';
	constructor(object: SharedObject) {
		this.object = object.id;
		this.objectData = object;
		this.start = new Date().toISOString();
		this.end = new Date().toISOString();
	}
	makeItAllDay() {
		// all day event means end is the next day of start
		const start = DateTime.fromISO(this.start);
		this.end = start.plus({ days: 1 }).toISO();
	}
	get allDay(): boolean {
		// all day event means end is the next day of start
		const start = DateTime.fromISO(this.start);
		const end = DateTime.fromISO(this.end);
		return end.diff(start, 'days').days > 0;
	}
}
