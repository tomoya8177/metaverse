import {
	LocalVideoTrack,
	connect,
	createLocalTracks,
	createLocalVideoTrack,
	type RemoteTrack,
	RemoteVideoTrack,
	LocalVideoTrackPublication,
	RemoteParticipant,
	Room,
	LocalAudioTrackPublication,
	RemoteAudioTrack,
	LocalDataTrack,
	LocalAudioTrack,
	createLocalAudioTrack,
	LocalTrackPublication,
	RemoteDataTrack,
	RemoteTrackPublication
} from 'twilio-video';
import type { Event } from './Event';
import axios from 'axios';
import { Users } from './Users';
import type { Unit } from './Unit';
import type { User } from '$lib/types/User';

export class VideoChat {
	userId: string = '';
	roomId: string = '';
	room: any;
	audioOnly: boolean = false;
	localParticipant: any;
	dataTrack: LocalDataTrack | null = null;
	audioTrack: LocalAudioTrack | null = null;
	videoTrack: LocalVideoTrack | null = null;
	screenTrack: LocalVideoTrack | null = null;
	listeners: { [key: string]: (data: any) => void } = {};
	constructor() {
		//do nothing,
	}
	init(user: User, event: Event) {
		this.userId = user.id;
		this.roomId = event.id;
		this.audioOnly = !event.allowAudio || !event.allowVideo;
	}
	sendMessage(message: any) {
		if (!this.dataTrack) return alert('not connected to room');
		this.dataTrack.send(JSON.stringify(message));
	}
	async createTrack(type: 'data' | 'audio' | 'video' | 'screen') {
		switch (type) {
			case 'data':
				this.dataTrack = new LocalDataTrack();
				return this.dataTrack;
			case 'audio':
				this.audioTrack = await createLocalAudioTrack({
					name: 'audioOf' + this.userId
				});
				return this.audioTrack;
			case 'video':
				this.videoTrack = await createLocalVideoTrack({
					name: 'cameraOf' + this.userId,
					height: 300,
					frameRate: 24,
					width: 300
				});
				return this.videoTrack;
			case 'screen':
				const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 } });
				this.screenTrack = new LocalVideoTrack(stream.getTracks()[0], {
					name: 'screenOf' + this.userId
				});
				return this.screenTrack;
			default:
				return null;
		}
	}

	async connect() {
		//connect to twilio room
		if (!this.dataTrack) this.dataTrack = (await this.createTrack('data')) as LocalDataTrack;
		const result = await axios.post('/api/twilio-token', {
			userId: this.userId,
			roomId: this.roomId
		});
		if (!result.data.result) return;

		this.room = await connect(result.data.token, {
			name: this.roomId,
			tracks: [this.dataTrack]
		});
		this.localParticipant = this.room.localParticipant;
		console.log(`Successfully joined a Room: ${this.room}`);

		this.room.on('participantConnected', (participant: RemoteParticipant) => {
			console.log(`A remote Participant connected: ${participant}`);
			const me = Users.find(this.userId);

			listenToSubscriptions(participant);
		});

		// Log your Client's LocalParticipant in the Room
		console.log(`Connected to the Room as LocalParticipant "${this.localParticipant.identity}"`);

		// Log any Participants already connected to the Room
		this.room.participants.forEach((participant: RemoteParticipant) => {
			console.log(`Participant "${participant.identity}" is connected to the Room`);
			listenToSubscriptions(participant);
		});

		this.room.on('participantDisconnected', (participant: RemoteParticipant) => {
			console.log(`Participant disconnected: ${participant.identity}`);
			// Detach the local media elements
			const unit = Users.find(participant.identity);
			unit?.leave();
			Users.remove(participant.identity);
			participant.tracks.forEach((publication: RemoteTrackPublication) => {
				if (!publication.track || publication.track.kind == 'data') return;
				const attachedElements = publication.track.detach();
				attachedElements.forEach((element) => element.remove());
			});
		});

		this.room.on('disconnected', (room: Room) => {
			//alert('someone left the room');
			// Detach the local media elements
			this.localParticipant.tracks.forEach((publication: LocalVideoTrackPublication) => {
				const attachedElements = publication.track.detach();
				attachedElements.forEach((element) => element.remove());
			});
		});
	}
	listenTo(key: string, callback: (data: any) => void) {
		if (!this.dataTrack) return;
		this.listeners[key] = callback;
	}
	dontListenTo(key: string) {
		delete this.listeners[key];
	}

	async startMyAudio(): Promise<boolean> {
		await this.createTrack('audio');
		if (!this.audioTrack) return false;
		const publication = await this.localParticipant.publishTrack(this.audioTrack);
		return true;
	}
	async startShareScreen(): Promise<boolean> {
		//create video track of screen from usermedia
		await this.createTrack('screen');
		if (!this.screenTrack) {
			return false;
		}
		if (this.localParticipant.screenTrack) {
			this.localParticipant.screenTrack.stop();
		}
		const localMediaContainer = document.getElementById('myScreenPreview');
		const el = this.screenTrack.attach();
		el.addEventListener('loadedmetadata', () => {
			if (!this.screenTrack) {
				return false;
			}
			console.log('loadedmetadata', this.screenTrack.dimensions);
			if (!this.screenTrack.dimensions.height || !this.screenTrack.dimensions.width) return;
			el.style.width = '8rem';
			el.style.height =
				(8 * this.screenTrack.dimensions.height) / this.screenTrack.dimensions.width + 'rem';
		});
		localMediaContainer?.appendChild(el);
		const publication = await this.localParticipant.publishTrack(this.screenTrack);
		console.log('Successfully published your screen:', publication);
		return true;
	}

	async startMyVideo(): Promise<boolean> {
		await this.createTrack('video');
		if (!this.videoTrack) return false;
		const localMediaContainer = document.getElementById('myCameraPreview');
		const el = this.videoTrack.attach();
		el.style.width = '8rem';
		el.style.height = '8rem';
		localMediaContainer?.appendChild(el);
		const publication = await this.localParticipant.publishTrack(this.videoTrack);
		console.log('Successfully published your video:', publication);
		return true;
	}

	unpublishMyTrack(type: 'camera' | 'screen' | 'audio' = 'camera') {
		this.localParticipant.tracks.forEach(
			(publication: LocalAudioTrackPublication | LocalVideoTrackPublication) => {
				if (!publication.track.name.includes(type + 'Of')) return;
				publication.track.stop();
				publication.unpublish();
			}
		);
	}
}
export const videoChat = new VideoChat();

const listenToSubscriptions = (participant: RemoteParticipant) => {
	participant.on('trackSubscribed', (track) => {
		handleRemoteTrackSubscribed(track as RemoteTrack);
	});
	participant.on('trackUnsubscribed', (track) => {
		console.log('track unsubscribed', track);
		handleRemoteTrackUnsubscribed(track as RemoteTrack);
	});
};

const handleRemoteTrackUnsubscribed = (track: RemoteTrack) => {
	if (track.kind === 'data') return;
	detatchTrack(track as RemoteVideoTrack | RemoteAudioTrack);
};

const handleRemoteTrackSubscribed = (track: RemoteTrack) => {
	if (track.kind === 'data') {
		//for data
		const me = Users.find(videoChat.userId);
		if (!me) return;
		videoChat.sendMessage({
			key: 'handshake',
			user: {
				id: me.userId
			},
			position: me.position,
			rotation: me.rotation
		});
		track.on('message', (message: string) => {
			if (typeof message !== 'string') return;
			const parsed = JSON.parse(message);
			videoChat.listeners[parsed.key]?.(parsed);
		});
	} else {
		//for video and audio
		attachTrack(track as RemoteVideoTrack | RemoteAudioTrack);
	}
};

function attachTrack(track: RemoteVideoTrack | RemoteAudioTrack) {
	let container = document.querySelector('a-assets');
	const el = track.attach();
	el.id = track.sid;
	container?.appendChild(el);
	const unit = Users.find(
		track.name.replace('screenOf', '').replace('audioOf', '').replace('cameraOf', '')
	);
	if (!unit) return;
	if (track.name.includes('cameraOf')) {
		unit.showCamera(track as RemoteVideoTrack);
	} else if (track.name.includes('screenOf')) {
		el.addEventListener('loadedmetadata', () => {
			if (!unit) return;
			console.log({ track });

			unit.showScreen(track as RemoteVideoTrack);
		});
	} else if (track.name.includes('audioOf')) {
		//assuming this is audio
		unit.attachAudio(track as RemoteAudioTrack);
	}
}
function detatchTrack(track: RemoteTrack) {
	console.log('detatching track', track);
	const el = document.getElementById(track.sid);
	if (el) el.remove();
	const unit = Users.find(
		track.name.replace('cameraOf', '').replace('screenOf', '').replace('audioOf', '')
	);
	if (track.name.includes('cameraOf')) {
		if (!unit) return;
		unit.hideCamera();
	} else if (track.name.includes('screenOf')) {
		if (!unit) return;
		unit.hideScreen();
	} else if (track.name.includes('audioOf')) {
		if (!unit) return;
		unit.detachAudio();
	}
}
