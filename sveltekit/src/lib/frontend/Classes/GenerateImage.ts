import type { Promise } from '$lib/types/Promise';
import axios from 'axios';

export class GenerateImage {
	prompt: string;
	callback: (data: any) => void = () => {};
	data: any;
	constructor(prompt: string) {
		this.prompt = prompt;
		axios
			.post('/stability', {
				prompt: this.prompt
			})
			.then((res) => {
				console.log(res.data);
				const interval = setInterval(async () => {
					const promise: Promise = await axios
						.get('/api/promises/' + res.data.id)
						.then((res) => res.data);
					if (!promise.resolved) return;
					const file = JSON.parse(promise.data);
					this.callback(file);
					clearInterval(interval);
				}, 2000);
			});
	}
	onDone(func: (data: any) => void) {
		this.callback = func;
	}
}
