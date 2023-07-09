export class DBObject {
	id?: string;
	constructor(data: any) {
		// nothing
		if (data.id) {
			this.id = data.id;
		} else {
			this.id = '';
		}
	}
}
