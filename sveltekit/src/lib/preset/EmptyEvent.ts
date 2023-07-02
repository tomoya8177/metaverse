import type { Event } from '$lib/Classes/Event';

export const EmptyEvent: Event = {
	id: '',
	title: '',
	slug: '',
	allowAudio: false,
	allowVideo: false,
	organization: '',
	allowedUsers: '',
	isPublic: false,
	isOpen: true,
	capacity: 0
};
