import axios from 'axios';

type Actions = 'login' | 'logout';
class ActionHistory {
	id: string;
	user: string;
	event: string;
	organization: string;

	constructor(
		data: {
			user?: string;
			event?: string;
			organization?: string;
		} | null
	) {
		this.id = crypto.randomUUID();
		this.user = data?.user || '';
		this.event = data?.event || '';
		this.organization = data?.organization || '';
	}
	async send(action: Actions, data: any = {}) {
		await axios.post('/api/actions', {
			session: this.id,
			user: this.user,
			event: this.event,
			organization: this.organization,
			action: action,
			data: JSON.stringify(data)
		});
	}
}
export const actionHistory = new ActionHistory(null);
