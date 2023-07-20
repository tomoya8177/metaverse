import { PUBLIC_FileStackAPIKey } from '$env/static/public';
import axios, { type AxiosResponse } from 'axios';
import * as filestack from 'filestack-js';
import { writable, type Writable } from 'svelte/store';
class Uploader {
	client: filestack.Client;
	progress: Writable<number>;
	constructor() {
		this.client = filestack.init(PUBLIC_FileStackAPIKey);
		this.progress = writable(0);
	}
	launchPicker(
		accept: string | string[] | undefined,
		maxFiles: number = 1,
		onDone: (res: filestack.PickerResponse) => void
	) {
		this.client
			.picker({
				accept: accept,
				maxFiles,
				onUploadDone: (res) => {
					onDone(res);
				}
			})
			.open();
	}
	async uploadLocally(files: File[]): Promise<AxiosResponse> {
		const formData = new FormData();
		for (let i = 0; i < files.length; i++) {
			formData.append('file', files[i]);
		}
		const res = await axios.post('/api/localUpload', formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			},
			onUploadProgress: (progressEvent) => {
				var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
				this.progress.set(percentCompleted);
			}
		});
		this.progress.set(0);
		return res;
	}
}
export const uploader = new Uploader();
