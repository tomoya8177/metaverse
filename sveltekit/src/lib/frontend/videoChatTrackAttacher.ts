import axios from 'axios';
import { welcomeUnit } from './messageListeners';
import type { RemoteAudioTrack, RemoteTrack, RemoteVideoTrack } from 'twilio-video';
import { Users } from './Classes/Users';
import { ItemsInPreview } from '$lib/store';
import { SharedObject } from './Classes/SharedObject';
import type { Unit } from './Classes/Unit';

export const attachRemoteTrack = async (track: RemoteVideoTrack | RemoteAudioTrack) => {
	const remoteUserId = track.name
		.replace('screenOf', '')
		.replace('audioOf', '')
		.replace('cameraOf', '');
	let unit = Users.find(remoteUserId) as Unit;
	if (!unit) {
		const user = await axios.get('/api/users/' + remoteUserId).then((res) => res.data);
		unit = welcomeUnit(user);
	}
	console.log({ track });

	const el = track.attach();
	console.log;
	el.id = track.sid;
	let container = track.name.includes('audioOf')
		? document.querySelector('body')
		: document.querySelector('a-assets');
	container?.appendChild(el);
	if (track.name.includes('cameraOf')) {
		unit.showCamera(track as RemoteVideoTrack);
	} else if (track.name.includes('screenOf')) {
		el.addEventListener('loadedmetadata', () => {
			console.log('loaded screen of', el);
			const clonedEl = track.attach();
			ItemsInPreview.update((items) => {
				const newItem = new SharedObject({});
				newItem.id = track.sid;
				newItem.type = 'screen';
				newItem.inPreviewPane = true;

				return [...items, newItem];
			});
			setTimeout(() => {
				document
					.getElementById(track.sid + '_preview')
					?.querySelector('.content')
					?.appendChild(clonedEl);
			});
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
	) as Unit;
	if (!unit) {
		console.log('oh no, no unit found');
		return;
	}
	if (track.name.includes('cameraOf')) {
		unit.hideCamera();
	} else if (track.name.includes('screenOf')) {
		document.getElementById(track.sid + '_preview')?.remove();
		unit.hideScreen();
	} else if (track.name.includes('audioOf')) {
		unit.detachAudio();
	}
};
