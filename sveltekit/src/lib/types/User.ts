import type { Organization } from '$lib/types/Organization';
import type { UserRole } from './UserRole';
export type User = {
	id: string;
	nickname: string;
	email: string;
	avatarURL: string;
	lastRoom: string;
	lastPosition: string;
	isAdmin: boolean;
	organizations?: Organization[];
	userRoles?: UserRole[];
	createdAt: string;
	onMute: boolean;
	onVideoMute: boolean;
	onScreenShare: boolean;
};
