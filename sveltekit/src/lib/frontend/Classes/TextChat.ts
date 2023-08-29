import axios from 'axios';
import type { User } from './User';
import type { Room } from './Room';

import { Client, Conversation, Participant } from '@twilio/conversations';
class TextChat {
	conversation: Conversation | null = null;
	participant: Participant | null = null;
	messages: any[] = [];
	async init(user: User, room: Room) {
		const result = await axios
			.post('/api/twilio-token/conversations', {
				userId: user.id,
				roomId: room.id
			})
			.then((res) => res.data);
		console.log({ result });
		this.conversation = result.conversation;
		this.participant = result.participant;
	}
	async getMessages() {}
	async leave() {
		await this.conversation?.leave();
	}
}
export const textChat = new TextChat();
