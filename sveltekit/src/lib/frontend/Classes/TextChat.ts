import axios from 'axios';

const { Client } = require('@twilio/conversations');
class TextChat {
	async init() {
		const result = await axios.post('/api/twilio-token', {
			userId: this.userId,
			roomId: this.roomId
		});
		const client = new Client(token);
		client.on('initialized', () => {
			// Before you use the client, subscribe to the `'initialized'` event.
			// Use the client.
		});

		// To catch client initialization errors, subscribe to the `'initFailed'` event.
		client.on('initFailed', ({ error }) => {
			// Handle the error.
		});
	}
}
export const textChat = new TextChat();
