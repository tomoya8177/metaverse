import { attachTrack, detatchTrack, videoChat } from '$lib/Classes/VideoChat';
import 'aframe';
import type { RemoteVideoTrack } from 'twilio-video';

AFRAME.registerComponent('click-to-refresh-video', {
	init: function () {
		const material = this.el.getAttribute('material');
		console.log({ material });
		this.el.addEventListener('click', () => {
			const track = videoChat.tracks.find((track) => track.sid == material.src.id);
			console.log({ track });
			if (!track) return;

			console.log('refreshing');
			detatchTrack(track);
			setTimeout(() => {
				attachTrack(track as RemoteVideoTrack);
			}, 1000);
		});
	}
});
