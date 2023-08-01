import type { User } from '$lib/frontend/Classes/User';

export type ActionHistory = {
	createdAt: string;
	action: string;
	user: string;
	param?: string;
	data: string;
	session: string;
	userData: User;
};
