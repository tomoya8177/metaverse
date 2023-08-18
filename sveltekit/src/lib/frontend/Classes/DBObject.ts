import { escapeHTML } from '$lib/math/escapeHTML';
import { unescapeHTML } from '$lib/math/unescapeHTML';
import axios from 'axios';

export class DBObject {
	id: string;
	table: string;
	unescapedData: any;
	constructor(data: any) {
		// nothing
		this.id = data.id || crypto.randomUUID();
		this.table = data.table || '';
		//unescape values
		for (const key in data) {
			if (typeof data[key] == 'string') {
				data[key] = unescapeHTML(data[key] as string) as any;
			}
		}
		this.unescapedData = data;
	}
	escape() {
		const data = { ...this };
		//escape values
		for (const key in data) {
			if (typeof data[key] == 'string') {
				data[key] = escapeHTML(data[key] as string) as any;
			}
		}
		return data;
	}
	async read(): Promise<any> {
		if (!this.table) return console.error('DBObject.load() called without table name');

		const data = await axios.get(`/api/${this.table}/${this.id}`).then((res) => res.data);
		//unescape values
		for (const key in data) {
			if (typeof data[key] == 'string') {
				data[key] = unescapeHTML(data[key] as string) as any;
			}
		}
		this.constructor(data);
		return data;
	}
	async update(): Promise<any> {
		if (!this.table) return console.error('DBObject.load() called without table name');
		const data = this.purifyData();
		console.log('update', this.table, data);

		return await axios.put(`/api/${this.table}/${this.id}`, data).then((res) => res.data);
	}
	async delete(): Promise<any> {
		if (!this.table) return console.error('DBObject.load() called without table name');
		return await axios.delete(`/api/${this.table}/${this.id}`).then((res) => res.data);
	}
	async create(): Promise<any> {
		if (!this.table) return console.error('DBObject.load() called without table name');
		const data = this.purifyData();
		console.log('create', this.table, data);
		//escape values

		const createdObject = await axios.post(`/api/${this.table}`, data).then((res) => res.data);
		this.id = createdObject.id;
		return createdObject;
	}
	purifyData(): Object {
		const data: {
			[key: string]: string | number | boolean;
		} = {};
		for (const key in this) {
			let value = this[key];
			if (typeof value == 'string' || typeof value == 'number' || typeof value == 'boolean') {
				if (typeof value == 'string') {
					data[key] = escapeHTML(value);
				} else {
					data[key] = value;
				}
			}
		}
		return data;
	}
}
