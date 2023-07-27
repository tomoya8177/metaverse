import axios from 'axios';
import { reinstallAIBrain } from '../reinstallAIBrain';
import { _ } from '$lib/i18n';
import type { DocumentForAI } from '$lib/types/DocumentForAI';
import { myAlert } from '../toast';

export class Event {
	id: string;
	slug: string;
	title: string;
	allowAudio: boolean;
	allowVideo: boolean;
	organization: string;
	allowedUsers: string;
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
	constructor(obj: any) {
		this.id = obj.id;
		this.slug = obj.slug;
		this.title = obj.title;
		this.allowAudio = obj.allowAudio;
		this.allowVideo = obj.allowVideo;
		this.organization = obj.organization;
		this.allowedUsers = obj.allowedUsers;
		this.isPublic = obj.isPublic;
		this.isOpen = obj.isOpen;
		this.createdAt = obj.createdAt;
		this.organizationTitle = obj.organizationTitle;
		this.mentor = obj.mentor;
		this.prompt = obj.prompt;
		this.documents = obj.documents || [];
		this.environmentPreset = obj.environmentPreset;
		this.environmentModelURL = obj.environmentModelURL;
		this.navMeshModelURL = obj.navMeshModelURL;
		this.withMetaverse = obj.withMetaverse;

		if (this.allowedUsers == '') {
			this.allowedUsersArray = [];
		} else {
			console.log(this.allowedUsers);
			this.allowedUsersArray = JSON.parse(this.allowedUsers);
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
		const existingEventWithSlug = await axios
			.get('/api/events?slug=' + this.slug + '&organiation=' + this.organization)
			.then((res) => res.data);
		if (existingEventWithSlug.length && existingEventWithSlug[0].id != this.id) {
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
		const newEvent = await axios.post('/api/events', { ...this }).then((res) => res.data);
		let mentor;
		if (this.mentor) {
			mentor = await axios.get('/api/mentors/' + this.mentor).then((res) => res.data);
			await reinstallAIBrain(mentor);
		}
		return { newEvent, mentor };
	};
	update = async () => {
		this.allowedUsers = JSON.stringify(this.allowedUsersArray);
		const updatedEvent = await axios
			.put('/api/events/' + this.id, { ...this })
			.then((res) => res.data);

		let mentor;
		if (this.mentor) {
			mentor = await axios.get('/api/mentors/' + this.mentor).then((res) => res.data);
			await reinstallAIBrain(mentor);
		}
		return { updatedEvent, mentor };
	};
	delete = async () => {
		await axios.delete('/api/events/' + this.id);
		await axios.delete('/api/sessions?event=' + this.id);
		await axios.delete('/api/messages?event=' + this.id);
		const results = await axios.delete('/api/objects?event=' + this.id).then((res) => res.data);
	};
}
