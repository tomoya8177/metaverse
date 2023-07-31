import { ConfirmDialog, Toast } from '$lib/store';

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

let confirmDialog: {
	open: boolean;
	message: string;
	result: undefined | boolean;
};
ConfirmDialog.subscribe((value) => {
	confirmDialog = value;
});

class Confirm {
	constructor(message: string) {
		ConfirmDialog.set({
			open: true,
			message: message,
			result: undefined
		});
	}

	get result(): boolean | undefined {
		return confirmDialog.result;
	}

	async resolve(): Promise<boolean> {
		return new Promise((resolve) => {
			const unsubscribe = ConfirmDialog.subscribe((value) => {
				if (!value.open || typeof value.result === 'undefined') return;

				// Unsubscribe from the ConfirmDialog store to avoid memory leaks
				unsubscribe();

				// Resolve the promise with the final result
				console.log(value.result);
				ConfirmDialog.set({
					open: false,
					message: '',
					result: undefined
				});
				resolve(value.result);
			});
		});
	}
}

export const myConfirm = async (message: string): Promise<boolean> => {
	const confirm = new Confirm(message);
	return confirm.resolve();
};
