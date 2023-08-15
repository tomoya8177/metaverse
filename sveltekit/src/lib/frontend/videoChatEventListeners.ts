import type {
	LocalParticipant,
	LocalTrackPublication,
	LocalVideoTrack,
	Participant,
	RemoteDataTrack,
	RemoteParticipant,
	RemoteTrackPublication,
	RemoteVideoTrack,
	Room
} from 'twilio-video';
import { messageListeners } from './messageListeners';
import { attachRemoteTrack, detatchTrack } from './videoChatTrackAttacher';
import { Users } from './Classes/Users';
import { videoChat } from './Classes/VideoChat';
import { toast } from './toast';
import { _ } from '$lib/i18n';
import type { Unit } from './Classes/Unit';
import axios from 'axios';

export const onNewParticipantConnected = (room: Room) => {
	room.on('participantConnected', (participant: RemoteParticipant) => {
		participant.on('trackSubscribed', (track) => {
			if (track.kind === 'data') {
				messageListeners();

				setupDataTrackListener(track as RemoteDataTrack);
				sendHandshake();
				axios.get(`/api/users/${participant.identity}`).then((res) => {
					toast(`${res.data.nickname} ${_('has joined the room!')}`);
				});
			} else {
				attachRemoteTrack(track as RemoteVideoTrack);
			}
		});
		participant.on('trackSubscriptionFailed', (error, track) => {
			console.error('Track subscription failed:', error);
		});
		participant.on('trackUnsubscribed', (track) => {
			detatchTrack(track);
			console.log('track unsubscribed', track);
		});
	});
};
export const onParticipantAlreadyInRoom = (participants: Map<string, RemoteParticipant>) => {
	participants.forEach((participant: RemoteParticipant) => {
		console.log(`Participant "${participant.identity}" is in the Room`);
		participant.on('trackSubscribed', (track) => {
			console.log('track subscribed', track);
			if (track.kind === 'data') {
				messageListeners();
				setupDataTrackListener(track as RemoteDataTrack);
				sendHandshake();
				toast;
			} else {
				attachRemoteTrack(track as RemoteVideoTrack);
			}
		});
		participant.on('trackUnsubscribed', (track) => {
			console.log('track unsubscribed', track);
			detatchTrack(track);
		});
	});
};

export const onParticipantDisconnected = (room: Room) => {
	room.on('participantDisconnected', (participant: RemoteParticipant) => {
		console.log(`Participant disconnected: ${participant.identity}`);
		// Detach the media elements
		const unit = Users.find(participant.identity) as Unit;
		if (!unit) return;
		toast(`${unit.userData.nickname} ${_('left the room')}`);
		unit.leave();
		Users.remove(participant.identity);
		participant.tracks.forEach((publication: RemoteTrackPublication) => {
			if (!publication.track || publication.track.kind == 'data') return;
			const attachedElements = publication.track.detach();
			attachedElements.forEach((element: HTMLElement) => element.remove());
		});
	});
};

export const onDisconnected = (room: Room, localParticipant: LocalParticipant) => {
	room.on('disconnected', (room: Room) => {
		// i am leaving this room
		if (!localParticipant) return;
		localParticipant.tracks.forEach((publication: LocalTrackPublication) => {
			const track = publication.track;
			if (track.kind == 'data') return;
			const localVideoTrack = track as LocalVideoTrack;
			const attachedElements = localVideoTrack.detach();
			attachedElements.forEach((element: HTMLElement) => element.remove());
		});
	});
};

const setupDataTrackListener = (track: RemoteDataTrack) => {
	track.on('message', (message: string) => {
		if (typeof message !== 'string') return;
		try {
			const parsed = JSON.parse(message);
			videoChat.listeners[parsed.key]?.(parsed);
		} catch (e) {
			console.log('error parsing message', e, message);
		}
	});
};
const sendHandshake = () => {
	const me = Users.find(videoChat.userId);
	if (!me) return;
	videoChat.sendMessage({
		key: 'handshake',
		user: videoChat.user,
		position: me.position,
		rotation: me.rotation
	});
};
export const onTabClosed = (room: Room) => {
	window.addEventListener('beforeunload', () => {
		room.disconnect();
	});
};
export const onReconnecting = (room: Room) => {
	room.on('reconnecting', (error) => {
		if (error.code === 53001) {
			console.log('Reconnecting your signaling connection!', error.message);
		} else if (error.code === 53405) {
			console.log('Reconnecting your media connection!', error.message);
		}
		/* Update the application UI here */
		toast(_('Reconnecting your media connection...'));
	});
};
export const onReconnected = (room: Room) => {
	room.on('reconnected', () => {
		console.log('Reconnected your signaling and media connections!');
		/* Update the application UI here */
		toast(_('Reconnected your signaling and media connections!'));
	});
};
