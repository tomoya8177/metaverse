import { writable } from 'svelte/store';
import type { Event } from './frontend/Classes/Event';
import { emptyUser } from './preset/EmptyUser';
import type { SharedObject } from './frontend/Classes/SharedObject';

export const UserStore = writable({
	...emptyUser,
	id: '',
	nickname: '',
	email: '',
	avatarURL: '',
	lastRoom: '',
	lastPosition: '',
	isAdmin: false
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
export const EventStore = writable({} as Event);
export type xyz = {
	x: number;
	y: number;
	z: number;
};
export const FocusObjectStore = writable(null);
