import type { Promise } from '$lib/types/Promise';
import axios from 'axios';
import { myAlert, toast } from '../toast';
import { _ } from '$lib/i18n';
import type { File } from 'filestack-js/build/main/lib/api/upload';

export class GenerateImage {
	prompt: string;
	callback: (data: File) => void = () => {};
	data: any;
	constructor(prompt: string) {
		this.prompt = prompt;
		axios
			.post('/stability', {
				prompt: this.prompt
			})
			.then((res) => {
				console.log(res.data);
				if (typeof res.data == 'string' && res.data.includes('Non-200')) {
					myAlert(_('Error') + res.data);
					return;
				}
				const maxTrial = 30; //1 mins
				let trial = 0;
				const interval = setInterval(async () => {
					trial++;
					if (trial > maxTrial) {
						clearInterval(interval);
						myAlert(_('Something went wrong with AI with your prompt.') + ': ' + this.prompt);
						return;
					}
					const promise: Promise = await axios
						.get('/api/promises/' + res.data.id)
						.then((res) => res.data);
					if (!promise.resolved) return;
					const file: File = JSON.parse(promise.data);
					toast(_('Your image is ready!'));

					this.callback(file);
					clearInterval(interval);
				}, 2000);
			});
		toast(_('Your prompt is sent to AI. It may take up to 1 minute to generate an image.'));
	}
	onDone(func: (data: File) => void) {
		this.callback = func;
	}
}
