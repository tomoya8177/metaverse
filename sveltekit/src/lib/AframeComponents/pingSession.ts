import type { Room } from '$lib/frontend/Classes/Room';
import { sessionPing } from '$lib/frontend/Classes/sessionPing';
import { RoomStore } from '$lib/store';
import axios from 'axios';
let room: Room;
RoomStore.subscribe((value) => {
	room = value;
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
				room: room.id
			},
			this.el
		);
		this.session.start();
	}
});
