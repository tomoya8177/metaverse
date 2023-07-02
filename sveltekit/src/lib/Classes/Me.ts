import axios from 'axios';
import { Unit } from './Unit';
import { connect, createLocalTracks } from 'twilio-video';
function handleTrackDisabled(track) {
	track.on('disabled', () => {
		/* Hide the associated <video> element and show an avatar image. */
		alert('video muted');
	});
}
function handleTrackEnabled(track) {
	track.on('enabled', () => {
		/* Hide the avatar image and show the associated <video> element. */
		alert('video unmuted');
	});
}
export class Me extends Unit {
	cameraRig: Entity;
	constructor(userId: string) {
		super(userId);
		this.el.setAttribute('movement-controls', 'constrainToNavMesh: true;camera: #camera;');
		//this.el.setAttribute('wasd-controls', '');
		this.el.setAttribute('look-controls', '');
		this.el.setAttribute('update-position', '');
		const camera = document.createElement('a-camera');
		camera.setAttribute('id', 'camera');
		camera.setAttribute('look-controls-enabled', 'false');
		camera.setAttribute('wasd-controls-enabled', 'false');
		camera.setAttribute('position', '0 0.2 0.5');
		camera.setAttribute('rotation', '-15 0 0');
		this.cameraRig = document.createElement('a-entity');
		this.cameraRig.setAttribute('position', '0 1.6 0');
		this.avatarContainer.appendChild(this.cameraRig);
		this.cameraRig.appendChild(camera);

		//enter twiklio room
	}

	async twilioConnect(roomId: string) {
		const result = await axios.post('/api/twilio-token', { userId: this.userId, roomId: roomId });
		console.log({ result });
		if (!result.data.result) return;
		console.log('connecting to twilio room', result.data.token);
		createLocalTracks({
			audio: true,
			video: { height: 300, frameRate: 24, width: 300 },
			bandwidthProfile: {
				video: {
					mode: 'grid',
					maxSubscriptionBitrate: 2500000
				}
			},
			//maxAudioBitrate: 16000, //For music remove this line
			//For multiparty rooms (participants>=3) uncomment the line below
			preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],
			networkQuality: { local: 1, remote: 1 },
			noiseCancellationOptions: {
				sdkAssetsPath: 'path/to/hosted/krisp/audio/plugin/dist',
				vendor: 'krisp'
			}
		})
			.then((localTracks) => {
				return connect(result.data.token, {
					name: roomId,
					tracks: localTracks
				});
			})
			.then((room) => {
				const localParticipant = room.localParticipant;
				console.log(`Successfully joined a Room: ${room}`);
				const muteAudioButton = document.createElement('button');
				muteAudioButton.innerText = 'Mute My Audio';
				muteAudioButton.addEventListener('click', () => {
					localParticipant.audioTracks.forEach((publication) => {
						publication.track.disable();
					});
				});
				document.getElementById('media-container').appendChild(muteAudioButton);
				const muteVideoButton = document.createElement('button');
				muteVideoButton.innerText = 'Mute My Video';
				muteVideoButton.addEventListener('click', () => {
					localParticipant.videoTracks.forEach((publication) => {
						publication.track.disable();
					});
				});
				document.getElementById('media-container').appendChild(muteVideoButton);
				const unmuteAudioButton = document.createElement('button');
				unmuteAudioButton.innerText = 'Unmute My Audio';
				unmuteAudioButton.addEventListener('click', () => {
					room.localParticipant.audioTracks.forEach((publication) => {
						publication.track.enable();
					});
				});
				document.getElementById('media-container').appendChild(unmuteAudioButton);
				const unmuteVideoButton = document.createElement('button');
				unmuteVideoButton.innerText = 'Unmute My Video';
				unmuteVideoButton.addEventListener('click', () => {
					room.localParticipant.videoTracks.forEach((publication) => {
						publication.track.enable();
					});
				});
				document.getElementById('media-container').appendChild(unmuteVideoButton);
				const disconnectButton = document.createElement('button');
				disconnectButton.innerText = 'disconnect';
				disconnectButton.addEventListener('click', () => {
					room.disconnect();
				});
				document.getElementById('media-container').appendChild(disconnectButton);
				room.on('participantConnected', (participant) => {
					console.log(`A remote Participant connected: ${participant}`);

					let container = document.getElementById('media-container' + participant.identity);
					if (!container) {
						container = document.createElement('div');
						container.id = 'media-container' + participant.identity;
						document.getElementById('media-container').appendChild(container);
					}
					participant.tracks.forEach((publication) => {
						if (publication.isSubscribed) {
							const track = publication.track;
							container?.appendChild(track.attach());
						}
						if (publication.isSubscribed) {
							handleTrackDisabled(publication.track);
						}
						publication.on('subscribed', handleTrackDisabled);
						publication.on('subscribed', handleTrackEnabled);
					});

					participant.on('trackSubscribed', (track) => {
						container?.appendChild(track.attach());
					});
				});

				// Log your Client's LocalParticipant in the Room
				console.log(`Connected to the Room as LocalParticipant "${localParticipant.identity}"`);

				// Log any Participants already connected to the Room
				room.participants.forEach((participant) => {
					console.log(`Participant "${participant.identity}" is connected to the Room`);
					let container = document.getElementById('media-container' + participant.identity);
					if (!container) {
						container = document.createElement('div');
						container.id = 'media-container' + participant.identity;
						document.getElementById('media-container').appendChild(container);
					}

					participant.tracks.forEach((publication) => {
						if (publication.track) {
							container?.appendChild(publication.track.attach());
						}
						if (publication.isSubscribed) {
							handleTrackDisabled(publication.track);
						}
						publication.on('subscribed', handleTrackDisabled);
						publication.on('subscribed', handleTrackEnabled);
					});

					participant.on('trackSubscribed', (track) => {
						container?.appendChild(track.attach());
					});
				});

				// Log new Participants as they connect to the Room
				room.once('participantConnected', (participant) => {
					console.log(`Participant "${participant.identity}" has connected to the Room`);
				});

				// Log Participants as they disconnect from the Room
				room.once('participantDisconnected', (participant) => {
					console.log(`Participant "${participant.identity}" has disconnected from the Room`);
					alert('someone left the room');
				});
				room.on('disconnected', (room) => {
					// Detach the local media elements
					room.localParticipant.tracks.forEach((publication) => {
						const attachedElements = publication.track.detach();
						attachedElements.forEach((element) => element.remove());
					});
				});
			});
	}
}
