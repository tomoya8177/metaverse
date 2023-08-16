import type { Organization } from '$lib/types/Organization';
import type { UserRole } from '../../types/UserRole';
import axios from 'axios';
import { DBObject } from './DBObject';
import { myAlert } from '../toast';
import { _ } from '$lib/i18n';
import type { Unit } from './Unit';
import { PresetAvatars } from '$lib/preset/PresetAvatars';
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
	subtitle: string = '';
	nicknameURL: string = '';
	coin: number = 0;
	constructor(data: any) {
		data.table = 'users';
		super(data);
		this.nickname = data.nickname || 'Nickname';
		this.email = data.email || '';
		this.avatarURL =
			data.avatarURL ||
			PresetAvatars[Math.floor(Math.random() * PresetAvatars.length) | 0]?.url ||
			'';
		this.isAdmin = data.isAdmin || false;
		this.organizations = data.organizations || [];
		this.userRoles = data.userRoles || [];
		this.createdAt = data.createdAt || '';
		this.onMute = true;
		this.onVideoMute = true;
		this.description = data.description || '';
		this.subtitle = data.subtitle || '';
		this.nicknameURL = data.nicknameURL || '';
		this.coin = data.coin || 0;
	}
	get fullName(): string {
		if (!this.firstName && !this.lastName) return this.nickname;
		return this.firstName + ' ' + this.lastName;
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
	async addCoin(action: string, coins: number, from: User | undefined = undefined) {
		this.coin = this.coin + coins;
		this.update();
		await axios.post('/api/coinHistory', {
			coins,
			source: from?.id || '',
			user: this.id,
			action
		});
	}
}
