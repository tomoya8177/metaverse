import axios from 'axios';

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
	virtuaMentorName: string;
	virtuaMentorPrompt: string;
	withDocumentsForAI: boolean = false;
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
		this.virtuaMentorName = obj.virtuaMentorName;
		this.virtuaMentorPrompt = obj.virtuaMentorPrompt;
		if (this.allowedUsers == '') {
			this.allowedUsersArray = [];
		} else {
			console.log(this.allowedUsers);
			this.allowedUsersArray = JSON.parse(this.allowedUsers);
		}
	}
	async validate(): Promise<boolean> {
		if (!this.title) {
			alert('Please enter a title for the event.');
			return false;
		}
		if (!this.organization) {
			alert('Please select an organization for the event.');
			return false;
		}
		if (!this.slug) {
			alert('Please enter a slug for the event.');
			return false;
		}
		const existingEventWithSlug = await axios
			.get('/api/events?slug=' + this.slug)
			.then((res) => res.data);
		if (existingEventWithSlug.length && existingEventWithSlug[0].id != this.id) {
			alert('Slug already exists');
			return false;
		}
		return true;
	}
	get capacity(): number {
		return 50;
	}
}
