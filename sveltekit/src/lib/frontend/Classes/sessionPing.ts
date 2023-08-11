import axios from 'axios';
import type { Entity } from 'aframe';

type Session = {
	id?: string;
	instanceId?: string;
	type: string;
	room: string;
	user: string;
	startAt?: string;
	endAt?: string;
	components?: string;
};
export class sessionPing {
	session: Session;
	interval: any;
	el: Entity | null;
	constructor(data: Session, el: Entity | null) {
		this.session = data;
		this.el = el || null;
	}
	async start() {
		this.session = await axios
			.post('/api/sessions', {
				instanceId: this.session.instanceId,
				type: this.session.type,
				user: this.session.user,
				room: this.session.room
			})
			.then((res) => res.data);
		this.interval = setInterval(() => {
			const data = {
				position: this.el?.getAttribute('position'),
				rotation: this.el?.getAttribute('rotation'),
				scale: this.el?.getAttribute('scale')
			};
			axios.put('/api/sessions/' + this.session.id, {
				components: JSON.stringify(data)
			});
		}, 5000);
	}
	end() {
		//end interval
		clearInterval(this.interval);
	}
}
