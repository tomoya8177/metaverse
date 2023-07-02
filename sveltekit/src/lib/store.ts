import { writable } from 'svelte/store';

export const UserStore = writable({
	id: '',
	nickname: '',
	email: '',
	avatarURL: null,
	lastRoom: '',
	lastPosition: ''
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
export const EventStore = writable({
	id: '',
	slug: ''
});
export type xyz = {
	x: number;
	y: number;
	z: number;
};
