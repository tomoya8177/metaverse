import { PUBLIC_FileStackAPIKey } from '$env/static/public';
import * as filestack from 'filestack-js';
class Uploader {
	client: filestack.Client;
	constructor() {
		this.client = filestack.init(PUBLIC_FileStackAPIKey);
	}
	launchPicker(
		accept: string | string[] | undefined,
		onDone: (res: filestack.PickerResponse) => void
	) {
		this.client
			.picker({
				accept: accept,
				maxFiles: 1,
				onUploadDone: (res) => {
					onDone(res);
				}
			})
			.open();
	}
}
export const uploader = new Uploader();
