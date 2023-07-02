import { connect, createLocalTracks } from 'twilio-video';
import type { Event } from './Event';
import axios from 'axios';

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
	async connect() {
		//connect to twilio room
		const result = await axios.post('/api/twilio-token', {
			userId: this.userId,
			roomId: this.roomId
		});
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
			preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],
			networkQuality: { local: 1, remote: 1 },
			noiseCancellationOptions: {
				sdkAssetsPath: 'path/to/hosted/krisp/audio/plugin/dist',
				vendor: 'krisp'
			}
		})
			.then((localTracks) => {
				return connect(result.data.token, {
					name: this.roomId,
					tracks: localTracks
				});
			})
			.then((room) => {
				this.room = room;
				this.localParticipant = room.localParticipant;
				console.log(`Successfully joined a Room: ${room}`);
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
				console.log(
					`Connected to the Room as LocalParticipant "${this.localParticipant.identity}"`
				);

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

				room.on('disconnected', (room) => {
					alert('someone left the room');
					// Detach the local media elements
					room.localParticipant.tracks.forEach((publication) => {
						const attachedElements = publication.track.detach();
						attachedElements.forEach((element) => element.remove());
					});
				});
			});
	}
	enableAudio() {
		const muteAudioButton = document.createElement('button');
		muteAudioButton.innerText = 'Mute My Audio';
		muteAudioButton.addEventListener('click', () => {
			this.localParticipant.audioTracks.forEach((publication) => {
				publication.track.disable();
			});
		});
		document.getElementById('media-container').appendChild(muteAudioButton);

		const unmuteAudioButton = document.createElement('button');
		unmuteAudioButton.innerText = 'Unmute My Audio';
		unmuteAudioButton.addEventListener('click', () => {
			this.room.this.localParticipant.audioTracks.forEach((publication) => {
				publication.track.enable();
			});
		});
		document.getElementById('media-container').appendChild(unmuteAudioButton);
	}
	enableVideo() {
		const muteVideoButton = document.createElement('button');
		muteVideoButton.innerText = 'Mute My Video';
		muteVideoButton.addEventListener('click', () => {
			this.localParticipant.videoTracks.forEach((publication) => {
				publication.track.disable();
			});
		});
		document.getElementById('media-container').appendChild(muteVideoButton);
		const unmuteVideoButton = document.createElement('button');
		unmuteVideoButton.innerText = 'Unmute My Video';
		unmuteVideoButton.addEventListener('click', () => {
			this.room.this.localParticipant.videoTracks.forEach((publication) => {
				publication.track.enable();
			});
		});
		document.getElementById('media-container').appendChild(unmuteVideoButton);
	}
}
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
