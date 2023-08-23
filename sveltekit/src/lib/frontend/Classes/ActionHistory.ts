import { PUBLIC_IS_DEV } from '$env/static/public';
import { RoomStore, UserStore } from '$lib/store';
import axios from 'axios';
import { DBObject } from './DBObject';
import { page } from '$app/stores';
import { cookies } from '../cookies';
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

export class ActionHistory extends DBObject {
	user: string;
	room: string;
	organization: string;
	session: string;
	page: any;
	param: string;
	userData?: any;
	roomData?: any;
	twilioRoomId?: string;
	constructor(data: any) {
		data.table = 'actions';
		super(data);
		this.session = crypto.randomUUID();
		this.user = data?.user || '';
		this.room = data?.room || '';
		this.organization = data?.organization || '';
		this.page = null;
		this.param = data?.param || '';
		this.twilioRoomId = data?.twilioRoomId || '';
	}
	async send(action: Actions, data: any = {}): Promise<any> {
		if (PUBLIC_IS_DEV == 'true') return;
		try {
			const response = await axios.post('/api/actions', {
				session: this.session,
				user: this.user,
				room: this.room,
				organization: this.organization,
				action: action,
				data: JSON.stringify(data),
				path: location.href,
				twilioRoomId: this.twilioRoomId,
				locale: cookies.get('locale') || ''
			});
			return response.data;
		} catch (error) {
			return false;
		}
	}
	get paramData() {
		return JSON.parse(this.param);
	}
}

export const actionHistory = new ActionHistory({});
UserStore.subscribe((value) => {
	actionHistory.user = value?.id || '';
});
RoomStore.subscribe((value) => {
	actionHistory.room = value?.id || '';
	actionHistory.twilioRoomId = value?.sid || '';
});
