import { DBObject } from './DBObject';

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
	}
}
