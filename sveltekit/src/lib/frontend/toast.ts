import { Toast } from '$lib/store';

export const toast = (message: string, duration: number = 3000) => {
	Toast.set({
		open: true,
		message: message,
		position: 'bottom'
	});
	setTimeout(() => {
		Toast.set({
			open: false,
			message: '',
			position: 'bottom'
		});
	}, duration);
};
export const myAlert = (message: string, duration: number = 3000) => {
	Toast.set({
		open: true,
		message: message,
		position: 'top'
	});
	setTimeout(() => {
		Toast.set({
			open: false,
			message: '',
			position: 'bottom'
		});
	}, duration);
};
