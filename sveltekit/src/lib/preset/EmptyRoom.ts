import type { Room } from '$lib/frontend/Classes/Room';

export const EmptyRoom: Room = {
	id: '',
	title: '',
	slug: '',
	organization: '',
	allowedUsers: '',
	isPublic: false,
	isOpen: true,
	capacity: 0,
	withMetaverse: true
};
