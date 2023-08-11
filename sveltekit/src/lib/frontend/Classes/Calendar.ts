import { Calendar } from 'fullcalendar';
import type { Event } from './Event';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { _ } from '$lib/i18n';
import { cookies } from '../cookies';
export class CalendarDisplay {
	calendar: Calendar | null;
	events: Event[];
	constructor() {
		this.calendar = null;
		this.events = [];
	}
	init(element: HTMLElement, events: Event[], onEventClicked: (eventId: string) => void) {
		this.events = events;
		this.calendar = new Calendar(element, {
			events: this.events.map((event) => event.toFullCalendarEvent()),
			plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
			themeSystem: 'Flatly',
			buttonText: {
				today: _('today'),
				month: _('month'),
				week: _('week'),
				day: _('day'),
				list: _('list')
			},
			headerToolbar: {
				left: 'title',
				right: 'dayGridMonth,timeGridWeek,listWeek'
			},
			footerToolbar: {
				center: 'prev,today,next'
			},
			locale: cookies.get('locale') || 'en',
			initialView: 'dayGridMonth',
			titleFormat: { year: 'numeric', month: 'short' },
			eventClick: (info) => {
				onEventClicked(info.event.id);
			}
		});
	}
	render() {
		if (!this.calendar) return;
		this.calendar.render();
	}
	removeEvent(eventId: string) {
		console.log('removeEvent', eventId);
		if (!this.calendar) return;
		this.calendar.getEventById(eventId)?.remove();
	}
	updateEvent(event: Event) {
		if (!this.calendar) return;
		this.calendar.getEventById(event.id)?.remove();
		this.calendar.addEvent(event.toFullCalendarEvent());
	}
	addEvent(event: Event) {
		if (!this.calendar) return;
		this.calendar.addEvent(event.toFullCalendarEvent());
	}
}
export const calendar = new CalendarDisplay();
