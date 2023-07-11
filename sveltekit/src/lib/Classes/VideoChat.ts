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
	RemoteTrackPublication,
	Participant
} from 'twilio-video';
import type { Event } from './Event';
import axios from 'axios';
import { Users } from './Users';
import type { Unit } from './Unit';
import type { User } from '$lib/types/User';
import { messageListeners, welcomeUnit } from '$lib/frontend/messageListeners';
import { UserStore } from '$lib/store';

let user: User;
UserStore.subscribe((u) => {
	user = u;
});

const dataTrackPublished: {
	promise: Promise<void>;
	resolve?: () => void;
	reject?: () => void;
} = {};

dataTrackPublished.promise = new Promise((resolve, reject) => {
	dataTrackPublished.resolve = resolve;
	dataTrackPublished.reject = reject;
});

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
		dataTrackPublished.promise.then(() => {
			if (!this.dataTrack) return alert('not connected to room');
			this.dataTrack.send(JSON.stringify(message));
		});
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
		// Log your Client's LocalParticipant in the Room
		console.log(`Connected to the Room as LocalParticipant "${this.localParticipant.identity}"`);
		this.localParticipant.on('trackPublished', (publication) => {
			console.log('some track published');
			if (publication.track === this.dataTrack) {
				console.log('data track published');
				//only then,
				dataTrackPublished.resolve();
			}
		});

		this.localParticipant.on('trackPublicationFailed', (error, track) => {
			if (track === this.dataTrack) {
				console.log('data track publish failed');
				dataTrackPublished.reject(error);
			}
		});
		//new participant joined
		this.room.on('participantConnected', (participant: RemoteParticipant) => {
			console.log(`A remote Participant connected: ${participant}`);

			participant.on('trackSubscribed', (track) => {
				console.log('track subscribed', track);
				if (track.kind === 'data') {
					messageListeners();

					this.setupDataTrackListener(track as RemoteDataTrack);
					this.sendHandshake();
				} else {
					attachTrack(track as RemoteVideoTrack);
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

		// Log any Participants already connected to the Room
		this.room.participants.forEach((participant: RemoteParticipant) => {
			console.log(`Participant "${participant.identity}" is in the Room`);
			participant.on('trackSubscribed', (track) => {
				console.log('track subscribed', track);
				if (track.kind === 'data') {
					messageListeners();
					this.setupDataTrackListener(track as RemoteDataTrack);
					this.sendHandshake();
				} else {
					attachTrack(track as RemoteVideoTrack);
				}
			});
			participant.on('trackUnsubscribed', (track) => {
				console.log('track unsubscribed', track);
				detatchTrack(track);
			});
		});

		this.room.on('participantDisconnected', (participant: RemoteParticipant) => {
			console.log(`Participant disconnected: ${participant.identity}`);
			// Detach the local media elements
			const unit = Users.find(participant.identity);
			if (!unit) return;
			unit.leave();
			Users.remove(participant.identity);
			participant.tracks.forEach((publication: RemoteTrackPublication) => {
				if (!publication.track || publication.track.kind == 'data') return;
				const attachedElements = publication.track.detach();
				attachedElements.forEach((element) => element.remove());
			});
		});

		this.room.on('disconnected', (room: Room) => {
			alert('leaving');
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
	get tracks() {
		//return all subscribed remote tracks
		const tracks: RemoteTrack[] = [];
		this.room.participants.forEach((participant) => {
			participant.tracks.forEach((publication) => {
				if (publication.track) tracks.push(publication.track);
			});
		});
		return tracks;
	}

	async startMyAudio() {
		await this.createTrack('audio');
		if (!this.audioTrack) return;
		const publication = await this.localParticipant.publishTrack(this.audioTrack);
	}
	async startShareScreen(): Promise<false | string> {
		//create video track of screen from usermedia
		await this.createTrack('screen');
		if (!this.screenTrack) {
			return false;
		}
		if (this.localParticipant.screenTrack) {
			this.localParticipant.screenTrack.stop();
		}
		const publication = await this.localParticipant.publishTrack(this.screenTrack);
		const localMediaContainer = document.querySelector('a-assets');
		const el = this.screenTrack.attach();
		console.log(this.screenTrack);
		el.id = publication.trackSid;
		localMediaContainer?.appendChild(el);
		console.log('Successfully published your screen:', publication);
		return publication.trackSid;
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
		if (type == 'camera') {
			const localMediaContainer = document.getElementById('myCameraPreview');
			if (!localMediaContainer) return;
			localMediaContainer.innerHTML = '';
		}
	}
	sendHandshake = () => {
		const me = Users.find(videoChat.userId);
		console.log('sending handshake');
		this.sendMessage({
			key: 'handshake',
			user,
			position: me.position,
			rotation: me.rotation
		});
	};
	setupDataTrackListener = (track: RemoteDataTrack) => {
		track.on('message', (message: string) => {
			if (typeof message !== 'string') return;
			try {
				const parsed = JSON.parse(message);
				this.listeners[parsed.key]?.(parsed);
			} catch (e) {
				console.log('error parsing message', message);
			}
		});
	};
}
export const videoChat = new VideoChat();

export const attachTrack = async (track: RemoteVideoTrack | RemoteAudioTrack) => {
	const userId = track.name.replace('screenOf', '').replace('audioOf', '').replace('cameraOf', '');
	let unit = Users.find(userId);
	if (!unit) {
		console.log('oh no, no unit found');
		const user = await axios.get('/api/users/' + userId).then((res) => res.data);
		unit = welcomeUnit(user);
	}
	console.log({ track });
	let container = document.querySelector('a-assets');

	const el = track.attach();
	el.id = track.sid;
	container?.appendChild(el);

	//let's return for now
	//return;
	if (track.name.includes('cameraOf')) {
		unit.showCamera(track as RemoteVideoTrack);
	} else if (track.name.includes('screenOf')) {
		el.addEventListener('loadedmetadata', () => {
			console.log('metadata loaded');
			if (!unit) return;

			unit.showScreen(track as RemoteVideoTrack, track.sid);
		});
	} else if (track.name.includes('audioOf')) {
		//assuming this is audio
		unit.attachAudio(track as RemoteAudioTrack);
	}
};
export const detatchTrack = (track: RemoteTrack) => {
	console.log('detatching track', track);
	const el = document.getElementById(track.sid);
	if (el) el.remove();
	const unit = Users.find(
		track.name.replace('cameraOf', '').replace('screenOf', '').replace('audioOf', '')
	);
	if (!unit) {
		console.log('oh no, no unit found');
		return;
	}
	if (track.name.includes('cameraOf')) {
		unit.hideCamera();
	} else if (track.name.includes('screenOf')) {
		unit.hideScreen();
	} else if (track.name.includes('audioOf')) {
		unit.detachAudio();
	}
};
