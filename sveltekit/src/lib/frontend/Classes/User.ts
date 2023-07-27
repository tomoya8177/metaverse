import type { Organization } from '$lib/types/Organization';
import type { UserRole } from '../../types/UserRole';
import axios from 'axios';
export class User {
	id: string;
	nickname: string;
	email: string;
	avatarURL: string | '';
	isAdmin: boolean;
	organizations?: Organization[];
	userRoles?: UserRole[];
	userRole?: UserRole;
	createdAt?: string;
	onMute?: boolean;
	onVideoMute?: boolean;
	onScreenShare?: boolean;
	isManager?: boolean;
	isMember?: boolean;
	firstName?: string;
	lastName?: string;
	description: string = '';
	constructor(data: any) {
		this.id = data.id;
		this.nickname = data.nickname;
		this.email = data.email;
		this.avatarURL = data.avatarURL;
		this.isAdmin = data.isAdmin;
		this.organizations = data.organizations;
		this.userRoles = data.userRoles;
		this.createdAt = data.createdAt;
		this.onMute = true;
		this.onVideoMute = true;
		this.description = data.description;
	}
	async delete(userRoleId: string) {
		await axios.delete('/api/userRoles/' + userRoleId);
		// await axios.delete('/api/sessions?user=' + this.id);
		// await axios.delete('/api/messages?user=' + this.id);
		// await axios.delete('/api/objects?user=' + this.id);
	}
}
