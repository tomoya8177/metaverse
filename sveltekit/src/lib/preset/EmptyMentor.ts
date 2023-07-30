import type { Mentor } from '$lib/types/Mentor';

export const EmptyMentor: Mentor = {
	id: '',
	user: '',
	organization: '',
	prompt: '',
	userData: {
		id: '',
		email: '',
		nickname: '',
		avatarURL: '',
		isAdmin: false,
		delete: async () => {},
		description: ''
	},
	documents: []
};
