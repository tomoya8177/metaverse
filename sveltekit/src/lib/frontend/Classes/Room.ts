import axios from 'axios';
import { _ } from '$lib/i18n';
import type { DocumentForAI } from '$lib/types/DocumentForAI';
import { myAlert, toast } from '../toast';
import { DBObject } from './DBObject';
import type { Mentor } from './Mentor';
import { writable } from 'svelte/store';
import type { User } from './User';
import { videoChat } from './VideoChat';
import { SharedObject } from './SharedObject';
import { sharedObjects } from './SharedObjects';
import { EnvironmentModelPresets, type Environment } from '$lib/preset/EnvironmentModelPresets';
import { textChat } from './TextChat';

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
	entryStatus = writable('entering' as 'entering' | 'connecting' | 'entered');
	sid: string = '';
	environment: Environment | null;
	isXRCloud: boolean = false;
	sceneId: string = '';
	xrCloudRoomId: string = '';
	xrCloudRoomUrl: string = '';
	twilioConversationsSid: string = '';
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
		this.entryStatus.set('entering');
		this.environment =
			EnvironmentModelPresets.find((env) => env.modelURL == this.environmentModelURL) || null;

		if (this.allowedUsers == '') {
			this.allowedUsersArray = [];
		} else {
			this.allowedUsersArray = JSON.parse(this.allowedUsers);
		}
		this.isXRCloud = data.isXRCloud;
		this.sceneId = data.sceneId;
		this.xrCloudRoomId = data.xrCloudRoomId;
		this.xrCloudRoomUrl = data.xrCloudRoomUrl;
		this.twilioConversationsSid = data.twilioConversationsSid;
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
			.get('/api/rooms?slug=' + this.slug + '&organization=' + this.organization)
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

	delete = async () => {
		await axios.delete('/api/rooms/' + this.id);
		await axios.delete('/api/sessions?room=' + this.id);
		await axios.delete('/api/messages?room=' + this.id);
		const results = await axios.delete('/api/objects?room=' + this.id).then((res) => res.data);
	};
	async enter(user: User): Promise<void> {
		videoChat.init(user, this);
		this.entryStatus.set('connecting');
		textChat.init(user, this);
	}
	async connect(): Promise<boolean> {
		this.sid = (await videoChat.connect()) || '';
		if (this.sid) {
			this.entryStatus.set('entered');
			toast(_('Connected to the room!'));
			return true;
		} else {
			myAlert(_('Connection Failed'));
			return false;
		}
		//textChat.connect();
	}
	loadSharedObjects = async (): Promise<void> => {
		const models = await axios.get('/api/objects?room=' + this.id).then((res) => res.data);
		const promises = models.map((model: SharedObject) => {
			const sharedObject = new SharedObject(model);
			sharedObject.attachElement();
			//on first load, don't play videos
			if (
				sharedObject.asset &&
				sharedObject.type.includes('video') &&
				sharedObject.asset instanceof HTMLVideoElement
			) {
				sharedObject.asset.autoplay = false;
			}
			sharedObjects.add(sharedObject);
			return sharedObject.loadAttachedEvent();
		});
		await Promise.all(promises);
		return;
	};
}
