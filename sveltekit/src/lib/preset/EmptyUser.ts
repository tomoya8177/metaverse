import type { User } from '$lib/types/User';

export const emptyUser: User = {
	id: '',
	nickname: '',
	email: '',
	isAdmin: false,
	avatarURL: '',
	lastRoom: '',
	lastPosition: '',
	organizations: [],
	onMute: true,
	onVideoMute: true
};
