import axios from 'axios';

export class DBObject {
	id: string;
	table: string;
	constructor(data: any) {
		// nothing
		this.id = data.id || '';
		this.table = data.table || '';
	}
	async read(): Promise<any> {
		if (!this.table) return console.error('DBObject.load() called without table name');
		return await axios.get('/api/' + this.table + '/' + this.id).then((res) => res.data);
	}
	async update(): Promise<any> {
		if (!this.table) return console.error('DBObject.load() called without table name');
		return await axios
			.put('/api/' + this.table + '/' + this.id, { ...this })
			.then((res) => res.data);
	}
	async delete(): Promise<any> {
		if (!this.table) return console.error('DBObject.load() called without table name');
		return await axios.delete('/api/' + this.table + '/' + this.id).then((res) => res.data);
	}
	async create(): Promise<any> {
		if (!this.table) return console.error('DBObject.load() called without table name');

		return await axios.post('/api/' + this.table, { ...this }).then((res) => res.data);
	}
}
