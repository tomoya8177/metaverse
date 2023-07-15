import { DBObject } from './DBObject';

export class Message extends DBObject {
	event: string;
	user: string;
	body: string;
	createdAt: string = new Date().toISOString();
	isTalking: boolean = false;
	constructor(data: any) {
		super(data);
		this.event = data.event;
		this.user = data.user;
		this.body = data.body;
		this.isTalking = data.isTalking || false;
	}
}
