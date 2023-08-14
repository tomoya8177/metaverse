import { PUBLIC_FileStackAPIKey } from '$env/static/public';
import axios, { type AxiosResponse } from 'axios';
import * as filestack from 'filestack-js';
import type { File } from 'filestack-js/build/main/lib/api/upload';
import { writable, type Writable } from 'svelte/store';
import { HTML2Canvas } from './HTML2Canvas';
import { myAlert } from '../toast';
class Uploader {
	client: filestack.Client;
	progress: Writable<number>;
	constructor() {
		console.log('constructing uploader');
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
	async uploadBlob(blob: Blob, filename: string): Promise<File> {
		const formData = new FormData();
		formData.append('fileUpload', blob, filename);
		const res = await axios.post(
			'https://www.filestackapi.com/api/store/S3?key=' + PUBLIC_FileStackAPIKey,
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			}
		);
		return res.data;
	}
	async uploadCanvas(selector: string, filename: string): Promise<File | false> {
		const html2canvas = new HTML2Canvas();
		const blob = await html2canvas.getJpegBlob(document.querySelector(selector), filename);
		if (!blob) {
			myAlert('Error');
			return false;
		}
		const file = await this.uploadBlob(blob, filename);
		return file;
	}
	async uploadCanvasPNG(selector: string, filename: string): Promise<File | false> {
		const html2canvas = new HTML2Canvas();
		const blob = await html2canvas.getPNGBlob(document.querySelector(selector), filename);
		if (!blob) {
			myAlert('Error');
			return false;
		}
		const file = await this.uploadBlob(blob, filename);
		return file;
	}
}
export const uploader = new Uploader();
