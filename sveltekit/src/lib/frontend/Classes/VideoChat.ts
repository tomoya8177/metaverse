import {
	LocalVideoTrack,
	connect,
	createLocalVideoTrack,
	type RemoteTrack,
	RemoteVideoTrack,
	Room,
	RemoteAudioTrack,
	LocalDataTrack,
	LocalAudioTrack,
	createLocalAudioTrack,
	LocalTrackPublication,
	type LocalTrack,
	LocalParticipant
} from 'twilio-video';
import type { Room as RoomType } from './Room';
import axios from 'axios';
import { Users } from './Users';
import type { User } from '$lib/frontend/Classes/User';
import { messageListeners, welcomeUnit } from '$lib/frontend/messageListeners';
import { UserStore } from '$lib/store';
import { sessionPing } from '$lib/frontend/Classes/sessionPing';
import {
	onDisconnected,
	onNewParticipantConnected,
	onParticipantAlreadyInRoom,
	onParticipantDisconnected
} from '$lib/frontend/videoChatEventListeners';

type trackType = 'audio' | 'camera' | 'screen' | 'data';

const dataTrackPublished: {
	promise?: Promise<void>;
	resolve?: () => void;
	reject?: (e: Error) => void;
} = {};

dataTrackPublished.promise = new Promise((resolve, reject) => {
	dataTrackPublished.resolve = resolve;
	dataTrackPublished.reject = reject;
});

export class VideoChat {
	user: User | null = null;
	userId: string = '';
	roomId: string = '';
	room: Room | null = null;
	audioOnly: boolean = false;
	localParticipant: LocalParticipant | null = null;
	dataTrack: LocalDataTrack | null = null;
	audioTrack: LocalAudioTrack | null = null;
	videoTrack: LocalVideoTrack | null = null;
	screenTrack: LocalVideoTrack | null = null;
	listeners: { [key: string]: (data: any) => void } = {};
	audioPingInterval: any;
	cameraPingInterval: any;
	screenPingInterval: any;
	connected: boolean = false;
	constructor() {
		//do nothing,
	}
	init(user: User, room: RoomType) {
		this.user = user;
		this.userId = user.id;
		this.roomId = room.id;
		this.audioOnly = false;
	}
	sendMessage(message: any) {
		if (typeof dataTrackPublished.promise === 'undefined')
			return alert('not initialized correctly');
		dataTrackPublished.promise.then(() => {
			if (!this.dataTrack) return alert('not connected to room');
			console.log('really sending');
			this.dataTrack.send(JSON.stringify(message));
		});
	}
	async createTrack(type: trackType) {
		switch (type) {
			case 'data':
				this.dataTrack = new LocalDataTrack();
				return this.dataTrack;
			case 'audio':
				this.audioTrack = await createLocalAudioTrack({
					name: 'audioOf' + this.userId
				});
				return this.audioTrack;
			case 'camera':
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
		this.connected = true;
		// Log your Client's LocalParticipant in the Room
		this.localParticipant.on('trackPublished', (publication: LocalTrackPublication) => {
			if (publication.track === this.dataTrack) {
				//only then,
				if (typeof dataTrackPublished.resolve === 'undefined') return;
				dataTrackPublished.resolve();
			}
		});

		this.localParticipant.on('trackPublicationFailed', (error: Error, track: LocalTrack) => {
			if (track === this.dataTrack) {
				console.log('data track publish failed');
				if (typeof dataTrackPublished.reject === 'undefined') return;
				dataTrackPublished.reject(error);
			}
		});
		//new participant joined
		onNewParticipantConnected(this.room);

		// Log any Participants already connected to the Room
		onParticipantAlreadyInRoom(this.room.participants);

		onParticipantDisconnected(this.room);

		onDisconnected(this.room, this.localParticipant);
	}
	listenTo(key: string, callback: (data: any) => void) {
		//if (!this.dataTrack) return;
		this.listeners[key] = callback;
	}
	dontListenTo(key: string) {
		delete this.listeners[key];
	}

	async startMyAudio() {
		if (!this.localParticipant) return;
		await this.createTrack('audio');
		if (!this.audioTrack) return;
		const publication = await this.localParticipant.publishTrack(this.audioTrack);
		this.audioPingInterval = new sessionPing(
			{
				user: this.userId,
				type: 'audio',
				room: this.roomId
			},
			null
		);
		this.audioPingInterval.start();
	}
	async startMyScreen(): Promise<false | string> {
		if (!this.localParticipant) return false;
		//create video track of screen from usermedia
		await this.createTrack('screen');
		if (!this.screenTrack) return false;

		const publication = await this.localParticipant.publishTrack(this.screenTrack);
		const localMediaContainer = document.querySelector('a-assets');
		const el = this.screenTrack.attach();
		el.id = publication.trackSid;
		localMediaContainer?.appendChild(el);
		return publication.trackSid;
	}

	async startMyCamera(): Promise<boolean> {
		if (!this.localParticipant) return false;
		await this.createTrack('camera');
		if (!this.videoTrack) return false;
		const localMediaContainer = document.getElementById('myCameraPreview');
		const el = this.videoTrack.attach();
		el.style.width = '8rem';
		el.style.height = '8rem';
		localMediaContainer?.appendChild(el);
		const publication = await this.localParticipant.publishTrack(this.videoTrack);
		console.log('Successfully published your video:', publication);
		this.cameraPingInterval = new sessionPing(
			{
				user: this.userId,
				type: 'camera',
				room: this.roomId
			},
			null
		);
		this.cameraPingInterval.start();
		return true;
	}

	unpublishMyTrack(type: 'camera' | 'screen' | 'audio') {
		if (!this.localParticipant) return;

		this.localParticipant.tracks.forEach((publication: LocalTrackPublication) => {
			if (!publication.track.name.includes(type + 'Of')) return;
			if (publication.track.kind == 'data') return;
			publication.track.stop();
			publication.unpublish();
		});
		if (type == 'camera') {
			const localMediaContainer = document.getElementById('myCameraPreview');
			if (!localMediaContainer) return;
			localMediaContainer.innerHTML = '';
			this.cameraPingInterval.end();
		} else if (type == 'screen') {
			this.screenPingInterval.end();
		} else if (type == 'audio') {
			this.audioPingInterval.end();
		}
	}
	leave() {
		if (this.connected) {
			this.room?.disconnect();
		}
	}
}
export const videoChat = new VideoChat();
