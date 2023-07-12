import { unescapeHTML } from '$lib/math/escapeHTML';
import { EventStore, UserStore, type xyz } from '$lib/store';
import type { Entity } from 'aframe';
import type { LocalVideoTrack, RemoteAudioTrack, RemoteVideoTrack } from 'twilio-video';
import { videoChat } from './VideoChat';
import { sessionPing } from '$lib/frontend/Classes/sessionPing';
import type { Event } from './Event';
import type { User } from '$lib/types/User';
import axios from 'axios';
let event: Event;
EventStore.subscribe((value) => {
	event = value;
});

export class Unit {
	userId: string;
	el: Entity;
	avatar: Entity | undefined;
	avatarContainer: Entity | undefined;
	nicknameData: string = '';
	onMute: boolean = false;
	onVideoMute: boolean = false;
	sharingScreen: boolean = false;
	constructor(userId: string) {
		console.log('creating unit', userId);
		this.userId = userId;
		//append element to the scene
		this.el = document.createElement('a-entity');
		this.el.id = userId;
		this.avatarContainer = document.createElement('a-entity');
		this.avatarContainer.setAttribute('rotate-at-position', '');
		this.el.appendChild(this.avatarContainer);
		const scene = document.querySelector('a-scene');
		scene?.appendChild(this.el);
	}
	set nickname(nickname: string) {
		let text = this.el.querySelector('a-text');
		if (!text) {
			text = document.createElement('a-text');
			text.setAttribute('position', '0 2 0');
			text.setAttribute('rotation', '0 180 0');
			text.setAttribute('align', 'center');
			this.avatarContainer.appendChild(text);
		}
		text.setAttribute('value', nickname);
	}

	set avatarURL(avatarURL: string) {
		if (!this.avatar) {
			this.avatar = document.createElement('a-gltf-model');
			this.avatarContainer.appendChild(this.avatar);
			this.avatar.setAttribute('position', '0 0.9 0');
			this.avatar.setAttribute('rotation', '0 180 0');
			this.avatar.setAttribute('hand-position', '');
		}
		this.avatar.setAttribute('src', avatarURL);
		this.avatarContainer.setAttribute('rotate-at-position', '');
	}
	set position(position: xyz) {
		this.el.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
	}

	set rotation(rotation: xyz) {
		this.el.setAttribute('rotation', `${rotation.x} ${rotation.y} ${rotation.z}`);
	}
	get position(): xyz {
		return {
			x: this.el.getAttribute('position')?.x || 0,
			y: this.el.getAttribute('position')?.y || 0,
			z: this.el.getAttribute('position')?.z || 0
		};
	}
	get rotation(): xyz {
		return {
			x: this.el.getAttribute('rotation')?.x || 0,
			y: this.el.getAttribute('rotation')?.y || 0,
			z: this.el.getAttribute('rotation')?.z || 0
		};
	}
	leave() {
		this.el.parentNode?.removeChild(this.el);
	}
	say(message: string) {
		const text = document.createElement('a-entity');
		text.setAttribute(
			'text',
			`value:${unescapeHTML(message)}; align:center;side:double;align:center;width:2`
		);
		text.setAttribute('position', '0 2.1 -0.4');
		text.setAttribute('rotation', '0 180 0');
		text.setAttribute('material', 'side:double');
		text.setAttribute('geometry', 'primitive: plane; width: auto; height: auto; ');
		this.avatarContainer.appendChild(text);
		setTimeout(() => {
			text.parentNode?.removeChild(text);
		}, Math.max(message.length * 500, 5000));
	}
	showCamera(track: RemoteVideoTrack) {
		const video = document.createElement('a-circle');
		video.setAttribute('material', 'src:#' + track.sid + ';shader:flat;side:double;');
		video.setAttribute('id', 'cameraCircleOf' + this.userId);
		video.setAttribute('position', '0 1.6 -0.3');
		video.setAttribute('rotation', '0 180 0');
		video.setAttribute('radius', '0.2');
		video.classList.add('clickable');

		this.avatarContainer.appendChild(video);
	}
	async showScreen(track: RemoteVideoTrack | LocalVideoTrack, sid: string): Promise<void> {
		const video = document.createElement('a-plane');
		video.setAttribute('side', 'double');
		video.setAttribute('id', 'screenPlaneOf' + this.userId);
		video.setAttribute(
			'position',
			`${this.position.x} ${this.position.y + 1.5} ${this.position.z}`
		);
		video.setAttribute('rotation', `0 ${this.rotation.y + 180} 0`);
		video.setAttribute('width', '1');
		video.setAttribute('material', 'src:#' + sid + ';shader: flat; side:double');
		video.setAttribute('editable-object', '');
		if (track.dimensions?.width && track.dimensions?.height) {
			video.setAttribute('height', (track.dimensions?.height / track.dimensions?.width).toString());
		}
		//send ping only when the screen is mine
		if (this.userId == videoChat.userId) {
			console.log('this screen is mine lets send ping');
			videoChat.screenPingInterval = new sessionPing(
				{
					instanceId: sid,
					user: this.userId,
					type: 'screen',
					event: event.id
				},
				video
			);
			videoChat.screenPingInterval.start();
		} else {
			// this is someone elses screen, thus get the position from db
			const session = await axios.get('/api/sessions?instanceId=' + sid).then((res) => res.data[0]);
			const parsedComponents = JSON.parse(session.components);
			if (parsedComponents) {
				video.setAttribute('position', parsedComponents.position);
				video.setAttribute('rotation', parsedComponents.rotation);
				video.setAttribute('scale', parsedComponents.scale);
			}
		}
		scene.appendChild(video);
	}
	hideScreen() {
		const video = document.getElementById('screenPlaneOf' + this.userId);
		video?.parentNode?.removeChild(video);
	}
	hideCamera() {
		const video = document.getElementById('cameraCircleOf' + this.userId);
		video?.parentNode?.removeChild(video);
	}
	attachAudio(track: RemoteAudioTrack) {
		const audio = document.createElement('a-entity');
		audio.setAttribute(
			'sound',
			'src:#' +
				track.sid +
				'; autoplay : true; volume : 1; refDistance : 3; rolloffFactor : 1; maxDistance : 20;'
		);
		audio.setAttribute('position', '0 1.5 0');
		audio.setAttribute('rotation', '0 180 0');
		this.avatarContainer.appendChild(audio);
	}
	detachAudio() {
		const audio = document.querySelector('a-entity[sound]');
		audio?.parentNode?.removeChild(audio);
	}
}
