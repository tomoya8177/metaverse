import axios from 'axios';
import { DateTime } from 'luxon';
import type { Entity } from 'aframe';

type Session = {
	id?: string;
	instanceId?: string;
	type: string;
	event: string;
	user: string;
	startAt?: string;
	endAt?: string;
	components?: string;
};
export class sessionPing {
	session: Session;
	interval: any;
	el: Entity;
	constructor(data: Session, el: Entity) {
		this.session = data;
		this.el = el;
	}
	async start() {
		this.session = await axios
			.post('/api/sessions', {
				instanceId: this.session.instanceId,
				type: this.session.type,
				user: this.session.user,
				event: this.session.event
			})
			.then((res) => res.data);
		this.interval = setInterval(() => {
			axios.put('/api/sessions/' + this.session.id, {
				components: JSON.stringify({
					position: this.el?.getAttribute('position'),
					rotation: this.el?.getAttribute('rotation'),
					scale: this.el?.getAttribute('scale')
				})
			});
		}, 5000);
	}
	end() {
		//end interval
		clearInterval(this.interval);
	}
}
