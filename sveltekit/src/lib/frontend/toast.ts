import { Toast } from '$lib/store';

export const toast = (message: string, duration: number = 3000) => {
	Toast.set({
		open: true,
		message: message
	});
	setTimeout(() => {
		Toast.set({
			open: false,
			message: ''
		});
	}, duration);
};
