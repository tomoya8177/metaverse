import {
	LocalVideoTrack,
	connect,
	createLocalTracks,
	createLocalVideoTrack,
	type RemoteTrack,
	RemoteVideoTrack,
	LocalVideoTrackPublication,
	Participant,
	RemoteParticipant,
	Room,
	type LocalTrack,
	LocalTrackPublication,
	LocalAudioTrackPublication
} from 'twilio-video';
import type { Event } from './Event';
import axios from 'axios';
import { Users } from './Users';
import type { Unit } from './Unit';

export class VideoChat {
	userId: string;
	roomId: string;
	room: any;
	audioOnly: boolean = false;
	localParticipant: any;
	constructor(event: Event, userId: string) {
		this.userId = userId;
		this.roomId = event.id;
		this.audioOnly = !event.allowAudio || !event.allowVideo;
	}
	async connect(withVideo: boolean = true) {
		//connect to twilio room
		const result = await axios.post('/api/twilio-token', {
			userId: this.userId,
			roomId: this.roomId
		});
		if (!result.data.result) return;
		const localTracks = await createLocalTracks({
			audio: true,
			video: false,

			networkQuality: { local: 1, remote: 1 },
			noiseCancellationOptions: {
				sdkAssetsPath: 'path/to/hosted/krisp/audio/plugin/dist',
				vendor: 'krisp'
			}
		});
		this.room = await connect(result.data.token, {
			name: this.roomId,
			tracks: localTracks
		});
		this.localParticipant = this.room.localParticipant;
		console.log(`Successfully joined a Room: ${this.room}`);

		this.room.on('participantConnected', (participant: RemoteParticipant) => {
			console.log(`A remote Participant connected: ${participant}`);

			participant.tracks.forEach((publication) => {
				if (publication.isSubscribed && publication.track) {
					handleRemoteTrackDisabled(publication.track);
				}
				publication.on('unsubscribed', handleRemoteTrackDisabled);
				publication.on('subscribed', handleRemoteTrackDisabled);
				publication.on('subscribed', handleRemoteTrackEnabled);
			});

			participant.on('trackSubscribed', (track) => {
				console.log('track subscribed', track);
				attachTrack(track as RemoteVideoTrack);
			});
			participant.on('trackUnsubscribed', (track) => {
				detatchTrack(track);
				console.log('track unsubscribed', track);
			});
		});

		// Log your Client's LocalParticipant in the Room
		console.log(`Connected to the Room as LocalParticipant "${this.localParticipant.identity}"`);

		// Log any Participants already connected to the Room
		this.room.participants.forEach((participant: RemoteParticipant) => {
			console.log(`Participant "${participant.identity}" is connected to the Room`);

			participant.tracks.forEach((publication) => {
				if (publication.isSubscribed && publication.track) {
					handleRemoteTrackDisabled(publication.track);
				}
				publication.on('unsubscribed', handleRemoteTrackDisabled);
				publication.on('subscribed', handleRemoteTrackDisabled);
				publication.on('subscribed', handleRemoteTrackEnabled);
			});

			participant.on('trackSubscribed', (track) => {
				console.log('track subscribed', track);
				attachTrack(track as RemoteVideoTrack);
			});
			participant.on('trackUnsubscribed', (track) => {
				console.log('track unsubscribed', track);
				detatchTrack(track);
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
	muteMyAudio() {
		this.localParticipant.audioTracks.forEach((publication: LocalAudioTrackPublication) => {
			publication.track.disable();
		});
	}
	unmuteMyAudio() {
		this.localParticipant.audioTracks.forEach((publication: LocalAudioTrackPublication) => {
			publication.track.enable();
		});
	}
	async startShareScreen(): Promise<boolean> {
		//create video track of screen from usermedia
		const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 } });
		const screenTrack = new LocalVideoTrack(stream.getTracks()[0], {
			name: 'screenOf' + this.userId
		});
		if (!screenTrack) {
			return false;
		}
		if (this.localParticipant.screenTrack) {
			this.localParticipant.screenTrack.stop();
		}
		const localMediaContainer = document.getElementById('myScreenPreview');
		const el = screenTrack.attach();
		el.addEventListener('loadedmetadata', () => {
			console.log('loadedmetadata', screenTrack.dimensions);
			if (!screenTrack.dimensions.height || !screenTrack.dimensions.width) return;
			el.style.width = '8rem';
			el.style.height = (8 * screenTrack.dimensions.height) / screenTrack.dimensions.width + 'rem';
		});
		localMediaContainer?.appendChild(el);
		const publication = await this.localParticipant.publishTrack(screenTrack);
		console.log('Successfully published your screen:', publication);
		return true;
	}

	async startMyVideo(): Promise<boolean> {
		const localVideoTrack = await createLocalVideoTrack({
			name: 'cameraOf' + this.userId,
			height: 300,
			frameRate: 24,
			width: 300
		});
		if (!localVideoTrack) return false;
		const localMediaContainer = document.getElementById('myCameraPreview');
		const el = localVideoTrack.attach();
		el.style.width = '8rem';
		el.style.height = '8rem';
		localMediaContainer?.appendChild(el);
		const publication = await this.localParticipant.publishTrack(localVideoTrack);

		console.log('Successfully published your video:', publication);
		return true;
	}
	muteMyVideo(type: string = 'camera') {
		this.localParticipant.videoTracks.forEach((publication: LocalVideoTrackPublication) => {
			if (!publication.track.name.includes(type + 'Of')) return;
			publication.track.stop();
			publication.unpublish();
		});
	}
}
function handleRemoteTrackDisabled(track: RemoteTrack) {
	console.log({ track }, 'disabled');
	track.on('disabled', () => {
		/* Hide the associated <video> element and show an avatar image. */
		if (track.kind == 'video') {
			alert('video muted');
			if (track.name.includes('cameraOf')) {
				const unit = Users.find(track.name.replace('cameraOf', ''));
				if (!unit) return;
				console.log('hiding camera');
				unit.hideCamera();
			}
		}
		if (track.kind == 'audio') {
		}
	});
}
function handleRemoteTrackEnabled(track: RemoteTrack) {
	console.log({ track });
	track.on('enabled', () => {
		if (track.kind == 'video') {
			alert('video unmuted');
			if (track.name.includes('cameraOf')) {
				const unit = Users.find(track.name.replace('cameraOf', ''));
				if (!unit) return;
				console.log('showing camera');
				unit.showCamera(track);
			}
		}
		if (track.kind == 'audio') {
		}
		/* Hide the avatar image and show the associated <video> element. */
	});
}
function attachTrack(track: RemoteVideoTrack) {
	let container = document.querySelector('a-assets');

	console.log({ track });
	const el = track.attach();
	el.id = track.sid;
	container?.appendChild(el);
	if (track.name.includes('cameraOf')) {
		console.log('yes on camera of', Users);
		const unit = Users.find(track.name.replace('cameraOf', ''));
		console.log('matchedUnit', { unit });
		if (!unit) return;
		unit.showCamera(track);
	} else if (track.name.includes('screenOf')) {
		el.addEventListener('loadedmetadata', () => {
			console.log('yes on screen of', Users);
			const unit = Users.find(track.name.replace('screenOf', ''));
			console.log('matchedUnit', { unit });
			if (!unit) return;
			console.log({ track });

			unit.showScreen(track);
		});
	}
}
function detatchTrack(track: RemoteTrack) {
	console.log('detatching track', track);
	const el = document.getElementById(track.name);
	if (el) el.remove();
	if (track.name.includes('cameraOf')) {
		const unit = Users.find(track.name.replace('cameraOf', ''));
		if (!unit) return;
		unit.hideCamera();
	} else if (track.name.includes('screenOf')) {
		const unit = Users.find(track.name.replace('screenOf', ''));
		if (!unit) return;
		unit.hideScreen();
	}
}
