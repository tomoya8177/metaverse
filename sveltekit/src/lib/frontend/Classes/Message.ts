import { DBObject } from './DBObject';

export class Message extends DBObject {
	event: string;
	user: string;
	body: string;
	type: string | null = null;
	url: string | null = null;
	createdAt?: string = new Date().toISOString();
	isTalking?: boolean = false;
	pinned?: boolean = false;
	constructor(data: any) {
		super(data);
		this.event = data.event;
		this.user = data.user;
		this.body = data.body;
		this.isTalking = data.isTalking || false;
		this.pinned = data.pinned || false;
		this.type = data.type || null;
		this.url = data.url || null;
	}
}
