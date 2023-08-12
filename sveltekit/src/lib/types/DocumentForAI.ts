import { DBObject } from '$lib/frontend/Classes/DBObject';

export class DocumentForAI extends DBObject {
	filename: string;
	type: string;
	createdAt: string;
	room: string;
	mentor: string;
	title: string;
	constructor(data: any) {
		data.table = 'documentsForAI';
		super(data);
		this.filename = data.filename || '';
		this.type = data.type || '';
		this.createdAt = data.createdAt || '';
		this.room = data.room || '';
		this.title = data.title || '';
		this.mentor = data.mentor || '';
	}
}
