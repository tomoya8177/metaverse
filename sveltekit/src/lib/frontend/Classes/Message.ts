import axios from 'axios';
import { DBObject } from './DBObject';
import { User } from './User';
import type { Room } from './Room';
import { ChatMessagesStore, RoomStore } from '$lib/store';
import { actionHistory } from './ActionHistory';
import { videoChat } from './VideoChat';
import { escapeHTML } from '$lib/math/escapeHTML';

const usersMemory: User[] = [];
let room: Room;
RoomStore.subscribe((value) => {
	room = value;
});

export class Message extends DBObject {
	room: string;
	user: string;
	body: string;
	type: string | null = null;
	url: string | null = null;
	createdAt?: string = new Date().toISOString();
	isTalking?: boolean = false;
	pinned?: boolean = false;
	handle: string = '';
	userData: User | null = null;
	constructor(data: any) {
		data.table = 'messages';
		super(data);
		this.room = this.unescapedData.room;
		this.user = this.unescapedData.user;
		this.body = this.unescapedData.body;
		this.isTalking = this.unescapedData.isTalking || false;
		this.pinned = this.unescapedData.pinned || false;
		this.type = this.unescapedData.type || null;
		this.url = this.unescapedData.url || null;
		this.handle = this.unescapedData.handle || '';
		const existingUser = usersMemory.find((user) => user.id == this.user);
		if (existingUser) {
			this.userData = existingUser;
		} else {
			axios.get('/api/users/' + this.user).then((res) => {
				this.userData = new User(res.data);
				usersMemory.push(this.userData);
			});
		}
	}
	get isAIs() {
		return this.user == room?.mentor;
	}
	async createSendOutAndPush(): Promise<void> {
		actionHistory.send('sendChatMessage', {
			id: this.id,
			body: escapeHTML(this.body),
			type: this.type
		});
		await this.create();
		videoChat.sendMessage({ ...this, key: 'textMessage' });
		ChatMessagesStore.update((arr) => {
			arr = [...arr, this];
			return arr;
		});
	}
}
