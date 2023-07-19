import type { Organization } from '$lib/types/Organization';
import type { UserRole } from '../../types/UserRole';
import axios from 'axios';
export class User {
	id: string;
	nickname: string;
	email: string;
	avatarURL: string | null;
	lastRoom: string;
	lastPosition: string;
	isAdmin: boolean;
	organizations?: Organization[];
	userRoles?: UserRole[];
	createdAt?: string;
	onMute: boolean;
	onVideoMute: boolean;
	onScreenShare?: boolean;
	isManager?: boolean;
	constructor(data: any) {
		this.id = data.id;
		this.nickname = data.nickname;
		this.email = data.email;
		this.avatarURL = data.avatarURL;
		this.lastRoom = data.lastRoom;
		this.lastPosition = data.lastPosition;
		this.isAdmin = data.isAdmin;
		this.organizations = data.organizations;
		this.userRoles = data.userRoles;
		this.createdAt = data.createdAt;
		this.onMute = true;
		this.onVideoMute = true;
	}
	async delete() {
		const user = await axios.delete('/api/users/' + this.id);
		await axios.delete('/api/userRoles?user=' + this.id);
		await axios.delete('/api/sessions?user=' + this.id);
		await axios.delete('/api/messages?user=' + this.id);
		await axios.delete('/api/objects?user=' + this.id);
	}
}
