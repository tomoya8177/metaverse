import { writable } from 'svelte/store';
import type { Room } from './frontend/Classes/Room';
import { emptyUser } from './preset/EmptyUser';
import type { SharedObject } from './frontend/Classes/SharedObject';
import { EmptyObject } from './preset/EmptyObject';
import type { Message } from './frontend/Classes/Message';
import type { User } from './frontend/Classes/User';

export const UserStore = writable({
	...emptyUser
} as User);
export const Toast = writable({
	open: false,
	message: '',
	position: 'bottom'
});
export const RigStore = writable({
	position: {
		x: 0,
		y: 0,
		z: 0
	},
	rotation: {
		x: 0,
		y: 0,
		z: 0
	}
});
export const RoomStore = writable({} as Room);
export type xyz = {
	x: number;
	y: number;
	z: number;
};
export const FocusObjectStore = writable(null as SharedObject | null);
export const PreviewPanelOpen = writable(false);
export const ItemsInPreview = writable([] as SharedObject[]);
export const ConfirmDialog = writable({
	open: false,
	message: '',
	result: undefined as undefined | boolean
});
export const TextChatOpen = writable(true);
export const ChatMessagesStore = writable([] as Message[]);
export const AISpeaks = writable(true);
