import { writable } from 'svelte/store';
import type { Event } from './Classes/Event';

export const UserStore = writable({
	id: '',
	nickname: '',
	email: '',
	avatarURL: null,
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
