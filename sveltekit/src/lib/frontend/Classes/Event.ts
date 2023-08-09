import { _ } from '$lib/i18n';
import axios from 'axios';
import { myAlert } from '../toast';
import { DBObject } from './DBObject';
import { DateTime } from 'luxon';
import * as ics from 'ics';
import type { User } from './User';
import type { Attendance } from './Attendance';
import type { SharedObject } from './SharedObject';
export class Event extends DBObject {
	object: string;
	description: string;
	summary: string;
	location: string;
	url: string;
	start: string;
	end: string;
	organization: string;
	constructor(data: any = {}) {
		data.table = 'events';
		super(data);
		this.object = this.unescapedData.object || '';
		this.description = this.unescapedData.description || '';
		this.summary = this.unescapedData.summary || '';
		this.location = this.unescapedData.location || '';
		this.url = this.unescapedData.url || '';
		this.start = this.unescapedData.start || '';
		this.end = this.unescapedData.end || '';
		this.organization = this.unescapedData.organization || '';
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
	async ical(users: User[], attendances: Attendance[], organizer: User | null = null) {
		const start = DateTime.fromISO(this.start);
		const end = DateTime.fromISO(this.end);
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
			title: this.summary,
			description: this.description,
			location: this.url,
			busyStatus: 'BUSY',
			organizer: organizer ? { name: organizer.nickname, email: organizer.email } : {},
			attendees: attendances.map((attendance) => {
				return {
					name: attendance.userData.firstName + ' ' + attendance.userData.lastName,
					email: attendance.userData.email,
					rsvp: true,
					partstat:
						attendance.status == 'attending'
							? 'ACCEPTED'
							: attendance.status == 'notAttending'
							? 'DECLINED'
							: 'NEEDS-ACTION',
					role: 'REQ-PARTICIPANT'
				};
			})
		};
		const { error, value } = await ics.createEvent(event);
		if (error) {
			console.log(error);
		}
		console.log({ value });

		const promises = users.map((user) => {
			return axios.post('/api/email', {
				to: user.email,
				subject: `${_('Invitation for an event')} ${this.summary}`,
				body: `${_('You are invited to an event')} ${this.summary} ${_('on')} ${DateTime.fromISO(
					this.start
				).toLocaleString(this.allDay ? DateTime.DATE : DateTime.DATETIME_FULL)}. ${_(
					'Please click the attchment to add it to your calendar.'
				)}`,
				attachments: [
					{
						filename: `${this.summary}.ics`,
						content: value,
						contentType: 'text/calendar',
						encoding: 'utf8'
					}
				]
			});
		});
		await Promise.all(promises);
		return;
	}
	escapeICalString(input: string): string {
		return input
			.replace(/;/g, `\;`) // Escape semicolons
			.replace(/,/g, `\,`) // Escape commas
			.replace(/:/g, `\:`) // Escape colons
			.replace(/'/g, `\'`) // Escape single quotes
			.replace(/"/g, `\"`); // Escape double quotes
	}
	attachObject(sharedObject: SharedObject) {
		this.object = sharedObject.id;
		this.summary = sharedObject.title;
		this.description = sharedObject.description;
		this.location = sharedObject.linkTo;
	}
}
