import { PUBLIC_API_ENDPOINT } from '$env/static/public';
import type { AxiosResponse } from 'axios';
import axios from 'axios';

class APICall {
	endpoint: string;
	constructor() {
		this.endpoint = PUBLIC_API_ENDPOINT;
	}
	async get(path: string): Promise<any> {
		return await axios.get(this.endpoint + path).then((res) => res.data);
	}
	async getOne(path: string): Promise<object | undefined> {
		return await axios.get(this.endpoint + path).then((res) => res.data[0]);
	}
	async post(path: string, data: any): Promise<any> {
		return await axios.post(this.endpoint + path, data).then((res) => res.data);
	}
	async put(path: string, data: any): Promise<any> {
		return await axios.put(this.endpoint + path, data).then((res) => res.data);
	}
	async delete(path: string): Promise<any> {
		return await axios.delete(this.endpoint + path).then((res) => res.data);
	}
}
export const apiCall = new APICall();
