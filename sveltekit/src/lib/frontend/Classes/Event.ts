import { _ } from '$lib/i18n';
import { myAlert } from '../toast';
import { DBObject } from './DBObject';
import { DateTime } from 'luxon';

export class Event extends DBObject {
	object: string;
	description: string;
	summary: string;
	location: string;
	url: string;
	start: string;
	end: string;
	organization: string;
	constructor(obj: any) {
		obj.table = 'events';
		super(obj);
		this.object = obj.object || '';
		this.description = obj.description || '';
		this.summary = obj.summary || '';
		this.location = obj.location || '';
		this.url = obj.url || '';
		this.start = obj.start || '';
		this.end = obj.end || '';
		this.organization = obj.organization || '';
	}
	get allDay(): boolean {
		if (!this.start) return false;
		if (!this.end) return false;
		return DateTime.fromISO(this.start).toISOTime() === DateTime.fromISO(this.end).toISOTime();
	}
	set allDay(val: boolean) {
		if (!this.start) {
			this.start = DateTime.now().toISO();
		}
		if (val) {
			//use DateTime from luxon
			//setting it all day makes the end time the same as the start time
			this.endTime = DateTime.fromISO(this.start).toISOTime();
			//if end date is the same as start date or it is not set, make it the next day
			if (this.endDate === this.startDate || !this.endDate || this.startDate > this.endDate) {
				this.endDate = this.startDate;
			}
			console.log(this.end);
		} else {
			//make the end time different from start time
			this.endTime = DateTime.fromISO(this.start).plus({ hours: 1 }).toISOTime();
			//make the end date the same day as the start date
			this.endDate = DateTime.fromISO(this.start).toISODate();
		}
	}
	set startDate(val: string) {
		const startTime = this.start?.split('T')[1] || '00:00:00';
		this.start = val + 'T' + startTime;
		//if end date is before start date, make it the same as start date
		if (this.endDate < this.startDate) {
			this.endDate = this.startDate;
		}
	}
	set startTime(val: string) {
		const startDate = this.start?.split('T')[0] || DateTime.now().toISODate();
		this.start = startDate + 'T' + val;
	}
	get startDate(): string {
		if (!this.start) return '';
		return this.start.split('T')[0];
	}
	get startTime(): string {
		if (!this.start) return '';
		return this.start.split('T')[1].substring(0, 5);
	}
	set endDate(val: string) {
		const endTime = this.end?.split('T')[1] || '00:00:00';
		//if allday, return a next date
		if (this.allDay) val = DateTime.fromISO(val).plus({ days: 1 }).toISODate();
		this.end = val + 'T' + endTime;
	}
	set endTime(val: string) {
		const endDate = this.end?.split('T')[0] || DateTime.now().toISODate();
		this.end = endDate + 'T' + val;
	}
	get endDate(): string {
		if (!this.end) return '';
		//if allday, return a previous date
		if (this.allDay) return DateTime.fromISO(this.end).minus({ days: 1 }).toISODate();
		return this.end.split('T')[0];
	}
	get endTime(): string {
		if (!this.end) return '';
		//convert to fit into time input
		return this.end.split('T')[1].substring(0, 5);
	}

	validate(): boolean {
		if (!this.summary) {
			myAlert(_('Please enter a summary'));
			return false;
		}
		if (!this.start) {
			myAlert(_('Please enter a start date'));
			return false;
		}
		return true;
	}
	toFullCalendarEvent() {
		return {
			...this,
			url: '',
			title: this.summary,
			allDay: this.allDay as boolean,
			start: DateTime.fromISO(this.start, {
				zone: 'utc'
			})
				.toLocal()
				.toJSDate(),
			end: DateTime.fromISO(this.end, {
				zone: 'utc'
			})
				.toLocal()
				.toJSDate()
		};
	}
}
