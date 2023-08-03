import { PUBLIC_LOCALHOST } from '$env/static/public';
import { escapeHTML, unescapeHTML } from '$lib/math/escapeHTML';
import axios from 'axios';

export class DBObject {
	id: string;
	table: string;
	unescapedData: any;
	constructor(data: any) {
		// nothing
		this.id = data.id || '';
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
		const data = { ...this };
		//escape values
		for (const key in data) {
			if (typeof data[key] == 'string') {
				data[key] = escapeHTML(data[key] as string) as any;
			}
		}
		return await axios.put(`/api/${this.table}/${this.id}`, data).then((res) => res.data);
	}
	async delete(): Promise<any> {
		if (!this.table) return console.error('DBObject.load() called without table name');
		return await axios.delete(`/api/${this.table}/${this.id}`).then((res) => res.data);
	}
	async create(): Promise<any> {
		if (!this.table) return console.error('DBObject.load() called without table name');
		console.log('create', this.table, this);
		const data = { ...this };
		//escape values
		for (const key in data) {
			if (typeof data[key] == 'string') {
				data[key] = escapeHTML(data[key] as string) as any;
			}
		}
		return await axios.post(`/api/${this.table}`, data).then((res) => res.data);
	}
}
