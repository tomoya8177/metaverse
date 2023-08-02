import { PUBLIC_IS_DEV } from '$env/static/public';
import { RoomStore, UserStore } from '$lib/store';
import axios from 'axios';

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
	| 'feedback';

class ActionHistory {
	id: string;
	user: string;
	room: string;
	organization: string;

	constructor(
		data: {
			user?: string;
			event?: string;
			organization?: string;
		} | null
	) {
		this.id = crypto.randomUUID();
		this.user = data?.user || '';
		this.event = data?.event || '';
		this.organization = data?.organization || '';
	}
	async send(action: Actions, data: any = {}) {
		if (PUBLIC_IS_DEV == 'true') return;
		await axios.post('/api/actions', {
			session: this.id,
			user: this.user,
			room: this.event,
			organization: this.organization,
			action: action,
			data: JSON.stringify(data)
		});
	}
}

export const actionHistory = new ActionHistory(null);
UserStore.subscribe((value) => {
	actionHistory.user = value?.id || '';
});
RoomStore.subscribe((value) => {
	actionHistory.event = value?.id || '';
});
