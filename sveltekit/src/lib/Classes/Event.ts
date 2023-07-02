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
	constructor(obj: Event) {
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
		if (this.allowedUsers == '') {
			this.allowedUsersArray = [];
		} else {
			console.log(this.allowedUsers);
			this.allowedUsersArray = JSON.parse(this.allowedUsers);
		}
	}
	validate(): boolean {
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
		return true;
	}
	get capacity(): number {
		if (this.allowAudio) return 50;
		return 100;
	}
}
