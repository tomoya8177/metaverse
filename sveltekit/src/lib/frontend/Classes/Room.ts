import axios from 'axios';
import { reinstallAIBrain } from '../reinstallAIBrain';
import { _ } from '$lib/i18n';
import type { DocumentForAI } from '$lib/types/DocumentForAI';
import { myAlert } from '../toast';
import { DBObject } from './DBObject';
import type { Mentor } from './Mentor';

export class Room extends DBObject {
	slug: string;
	title: string;
	organization: string;
	allowedUsersData: string;
	isPublic: boolean;
	isOpen: boolean;
	organizationTitle?: string;
	allowedUsersArray: string[];
	createdAt: string;
	mentor: string;
	prompt: string;
	documents: DocumentForAI[];
	environmentPreset?: string;
	environmentModelURL?: string;
	navMeshModelURL?: string;
	withMetaverse?: boolean;
	mentorData: Mentor;
	constructor(data: any) {
		data.table = 'rooms';
		super(data);
		this.id = this.unescapedData.id;
		this.slug = this.unescapedData.slug;
		this.title = this.unescapedData.title;
		this.organization = this.unescapedData.organization;
		this.allowedUsersData = this.unescapedData.allowedUsers;
		this.isPublic = this.unescapedData.isPublic;
		this.isOpen = this.unescapedData.isOpen;
		this.createdAt = this.unescapedData.createdAt;
		this.organizationTitle = this.unescapedData.organizationTitle;
		this.mentor = this.unescapedData.mentor;
		this.prompt = this.unescapedData.prompt;
		this.documents = this.unescapedData.documents || [];
		this.environmentPreset = this.unescapedData.environmentPreset;
		this.environmentModelURL = this.unescapedData.environmentModelURL;
		this.navMeshModelURL = this.unescapedData.navMeshModelURL;
		this.withMetaverse = this.unescapedData.withMetaverse;
		this.mentorData = this.unescapedData.mentorData;

		if (this.allowedUsers == '') {
			this.allowedUsersArray = [];
		} else {
			this.allowedUsersArray = JSON.parse(this.allowedUsers);
		}
	}
	get allowedUsers(): string {
		return this.allowedUsersData;
	}
	set allowedUsers(str) {
		this.allowedUsersData = str;
		if (str) {
			this.allowedUsersArray = JSON.parse(str);
		} else {
			this.allowedUsersArray = [];
		}
	}
	async validate(): Promise<boolean> {
		if (!this.title) {
			myAlert(_('Please enter a title for the room.'));
			return false;
		}
		if (!this.organization) {
			myAlert(_('Please select an organization for the room.'));
			return false;
		}
		if (!this.slug) {
			myAlert(_('Please enter a slug for the room.'));
			return false;
		}
		const existingRoomWithSlug = await axios
			.get('/api/rooms?slug=' + this.slug + '&organiation=' + this.organization)
			.then((res) => res.data);
		if (existingRoomWithSlug.length && existingRoomWithSlug[0].id != this.id) {
			myAlert(_('Slug already exists'));
			return false;
		}
		return true;
	}
	get capacity(): number {
		return 50;
	}
	create = async () => {
		this.allowedUsers = JSON.stringify(this.allowedUsersArray);
		const newRoom = await axios.post('/api/rooms', { ...this }).then((res) => res.data);
		let mentor;
		if (this.mentor) {
			mentor = await axios.get('/api/mentors/' + this.mentor).then((res) => res.data);
			await reinstallAIBrain(mentor);
		}
		return { newRoom, mentor };
	};
	update = async () => {
		this.allowedUsers = JSON.stringify(this.allowedUsersArray);
		const updatedRoom = await axios
			.put('/api/rooms/' + this.id, { ...this })
			.then((res) => res.data);

		let mentor;
		if (this.mentor) {
			mentor = await axios.get('/api/mentors/' + this.mentor).then((res) => res.data);
			await reinstallAIBrain(mentor);
		}
		return { updatedRoom, mentor };
	};
	delete = async () => {
		await axios.delete('/api/rooms/' + this.id);
		await axios.delete('/api/sessions?room=' + this.id);
		await axios.delete('/api/messages?room=' + this.id);
		const results = await axios.delete('/api/objects?room=' + this.id).then((res) => res.data);
	};
}
