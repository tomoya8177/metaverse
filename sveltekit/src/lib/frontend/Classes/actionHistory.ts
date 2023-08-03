import { PUBLIC_IS_DEV } from '$env/static/public';
import { RoomStore, UserStore } from '$lib/store';
import axios from 'axios';
import { DBObject } from './DBObject';
import { page } from '$app/stores';
let thisPage: any;
page.subscribe((value) => {
	thisPage = value;
});
type Actions =
	| 'login'
	| 'logout'
	| 'visit'
	| 'enteringRoom'
	| 'leaveRoom'
	| 'enterRoom'
	| 'changeEmail'
	| 'profileUpdate'
	| 'startMyCamera'
	| 'hideMyCamera'
	| 'hideMyScreen'
	| 'startMyScreen'
	| 'uploadToScene'
	| 'sendChatMessage'
	| 'sendQuestionToAI'
	| 'uploadToChat'
	| 'generateImage'
	| 'sendFileFromChatToRoom'
	| 'pinOrUnpinMessage'
	| 'deleteMessage'
	| 'connectAudio'
	| 'disconnectAudio'
	| 'selectAvatar'
	| 'inviteUser'
	| 'verify'
	| 'changeLanguage'
	| 'deleteOrganization'
	| 'createUser'
	| 'deleteUser'
	| 'updateUser'
	| 'createRoom'
	| 'updateRoom'
	| 'deleteRoom'
	| 'createMentor'
	| 'updateMentor'
	| 'deleteMentor'
	| 'feedback'
	| 'dashboard'
	| 'managerConsole';

class ActionHistory extends DBObject {
	user: string;
	room: string;
	organization: string;
	session: string;
	constructor(data: any) {
		data.table = 'actions';
		super(data);
		this.session = crypto.randomUUID();
		this.user = data?.user || '';
		this.room = data?.room || '';
		this.organization = data?.organization || '';
	}
	async send(action: Actions, data: any = {}) {
		if (PUBLIC_IS_DEV == 'true') return;
		await axios.post('/api/actions', {
			session: this.session,
			user: this.user,
			room: this.room,
			organization: this.organization,
			action: action,
			data: JSON.stringify(data),
			path: thisPage.url.pathname
		});
	}
}

export const actionHistory = new ActionHistory({});
UserStore.subscribe((value) => {
	actionHistory.user = value?.id || '';
});
RoomStore.subscribe((value) => {
	actionHistory.room = value?.id || '';
});
