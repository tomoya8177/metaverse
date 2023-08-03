import type { Organization } from '$lib/types/Organization';
import type { UserRole } from '../../types/UserRole';
import axios from 'axios';
import { DBObject } from './DBObject';
import { myAlert } from '../toast';
import { _ } from '$lib/i18n';
import { PUBLIC_LOCALHOST } from '$env/static/public';
export class User extends DBObject {
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
		data.table = 'users';
		super(data);
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
	async validate(): Promise<boolean> {
		if (!this.nickname) {
			myAlert(_('Nickname is required'));
			return false;
		}
		const existing = await axios.get('/api/users?email=' + this.email).then((res) => res.data);
		if (existing.length > 0 && existing[0].id != this.id) {
			myAlert(_('Email already exists'));
			return false;
		}
		return true;
	}
}
