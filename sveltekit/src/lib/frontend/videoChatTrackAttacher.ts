import { Users } from '$lib/Classes/Users';
import axios from 'axios';
import { welcomeUnit } from './messageListeners';
import type { RemoteAudioTrack, RemoteTrack, RemoteVideoTrack } from 'twilio-video';

export const attachRemoteTrack = async (track: RemoteVideoTrack | RemoteAudioTrack) => {
	const remoteUserId = track.name
		.replace('screenOf', '')
		.replace('audioOf', '')
		.replace('cameraOf', '');
	let unit = Users.find(remoteUserId);
	if (!unit) {
		const user = await axios.get('/api/users/' + remoteUserId).then((res) => res.data);
		unit = welcomeUnit(user);
	}
	console.log({ track });
	let container = document.querySelector('a-assets');

	const el = track.attach();
	el.id = track.sid;
	container?.appendChild(el);
	if (track.name.includes('cameraOf')) {
		unit.showCamera(track as RemoteVideoTrack);
	} else if (track.name.includes('screenOf')) {
		el.addEventListener('loadedmetadata', () => {
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
