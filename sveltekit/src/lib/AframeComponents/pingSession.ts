import type { Event } from '$lib/frontend/Classes/Event';
import { sessionPing } from '$lib/frontend/Classes/sessionPing';
import { EventStore } from '$lib/store';
import 'aframe';
import axios from 'axios';
let event: Event;
EventStore.subscribe((value) => {
	event = value;
});
AFRAME.registerComponent('ping-session', {
	schema: {
		user: { type: 'string', default: '' },
		instanceId: { type: 'string', default: '' },
		type: { type: 'string', default: '' }
	},
	init: function () {
		this.session = new sessionPing(
			{
				user: this.data.user,
				type: this.data.type,
				event: event.id
			},
			this.el
		);
		this.session.start();
	}
});
