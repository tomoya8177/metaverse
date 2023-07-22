import type { User } from '$lib/frontend/Classes/User';

export const emptyUser: User = {
	id: '',
	nickname: '',
	email: '',
	isAdmin: false,
	avatarURL: '',
	organizations: [],
	onMute: true,
	onVideoMute: true,
	isManager: false
};
