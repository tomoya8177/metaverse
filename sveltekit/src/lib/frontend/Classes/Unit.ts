import { unescapeHTML } from 'mymetaverse-helper';
import { RoomStore, ItemsInPreview, UserStore, type xyz } from '$lib/store';
import type { Entity } from 'aframe';
import type { LocalVideoTrack, RemoteAudioTrack, RemoteVideoTrack } from 'twilio-video';
import { videoChat } from './VideoChat';
import { sessionPing } from '$lib/frontend/Classes/sessionPing';
import type { Room } from './Room';
import type { User } from '$lib/frontend/Classes/User';
import axios from 'axios';
import { degree2radian } from 'mymetaverse-helper';

import { sharedObjects } from './SharedObjects';
import { pollAudioLevel } from '../pollAudioLevel';
import { SharedObject } from './SharedObject';
let room: Room;
RoomStore.subscribe((value) => {
	if (!value) return;
	room = value;
});
let loggedInUser: User;
UserStore.subscribe((value) => {
	if (!value) return;
	loggedInUser = value;
});

export class Unit {
	id: string;
	el: Entity;
	avatar: Entity | null = null;
	avatarContainer: Entity;
	nicknameData: string = '';
	onMute: boolean = false;
	onVideoMute: boolean = false;
	sharingScreen: boolean = false;
	audioLevel: number = 0;
	userData: User;
	audioSid: string = '';
	audioEl: HTMLAudioElement | null = null;
	constructor(data: User) {
		this.userData = data;
		this.id = data.id;
		//append element to the scene
		this.el = document.createElement('a-entity');
		this.el.id = data.id;
		this.avatarContainer = document.createElement('a-entity');
		this.avatarContainer.setAttribute('rotate-at-position', '');
		this.el.appendChild(this.avatarContainer);
		this.el.setAttribute('click-to-wave', 'enabled:true;userId:' + this.id);

		if (!this.avatar) {
			this.avatar = document.createElement('a-gltf-model');
			this.avatarContainer.appendChild(this.avatar);
			this.avatar.setAttribute('position', '0 0.9 0');
			this.avatar.setAttribute('rotation', '0 180 0');
			this.avatar.setAttribute('hand-position', '');
			this.avatar.setAttribute('smile', '');
			this.avatar.setAttribute('animation-mixer', 'clip:idle_eyes');
		}
		this.avatar.setAttribute('src', this.avatarURLWithParams);
		this.avatarContainer.setAttribute('rotate-at-position', '');
		const scene = document.querySelector('a-scene');

		this.setNickname();
		scene?.appendChild(this.el);
		if (data.lastRoom == room.id && data.lastPosition) {
			this.position = JSON.parse(data.lastPosition).position;
			this.rotation = JSON.parse(data.lastPosition).rotation;
		}
	}
	get avatarURLWithParams(): string {
		return (
			this.userData.avatarURL +
			'?quality=medium&useHands=false&morphTargets=mouthSmile,jawOpen,mouthOpen'
		);
	}
	get nickname(): string {
		return this.nicknameData;
	}
	setNickname() {
		if (this.id == loggedInUser.id) return;
		if (this.userData.nicknameURL) {
			let asset: HTMLImageElement | null = null;
			const existingAsset = document.querySelector(`#nameTagFor${this.userData.id}`);
			if (existingAsset) {
				//remove
				existingAsset.parentElement?.removeChild(existingAsset);
			}
			const el = document.createElement('img');
			if (el instanceof HTMLImageElement) {
				asset = el;
				asset.setAttribute('id', 'nameTagFor' + this.userData.id);
				asset.setAttribute('crossorigin', 'anonymous');
				document.querySelector('a-assets')?.appendChild(asset);
				asset.onload = () => {
					if (!asset) return;
					//get aspect ratio
					const width = asset.width;
					const height = asset.height;
					const aspectRatio = height / width;
					image.setAttribute('height', '0.2');
					image.setAttribute('width', (0.2 / aspectRatio).toString());
				};
			}
			if (!asset) return;
			asset.setAttribute('src', this.userData.nicknameURL);
			let image: Element;
			const existingImage = this.el.querySelector('a-image');
			if (existingImage) {
				//remove
				existingImage.parentElement?.removeChild(existingImage);
			}
			image = document.createElement('a-image');
			image.setAttribute('side', 'front');
			image.setAttribute('position', '0 1.85 0');
			image.setAttribute('rotation', '0 180 0');
			image.setAttribute('src', `#nameTagFor${this.userData.id}`);
			this.avatarContainer.appendChild(image);
		} else {
			//text nickname
			let text = this.el.querySelector('a-text');
			if (!text) {
				text = document.createElement('a-text');
				text.setAttribute('position', '0 2 0');
				text.setAttribute('rotation', '0 180 0');
				text.setAttribute('align', 'center');
				this.avatarContainer.appendChild(text);
			}
			text.setAttribute('value', this.userData.nickname);
		}
	}
	resetProfile(): void {
		this.setNickname();
	}

	set position(position: xyz) {
		this.el.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
	}
	animatePosition(position: xyz) {
		this.el.setAttribute('animation', {
			property: 'position',
			from: `${this.position.x} ${this.position.y} ${this.position.z}`,
			to: `${position.x} ${position.y} ${position.z}`,
			dur: 100,
			easing: 'linear'
		});
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
	say(message: string = '') {
		if (!this.avatarContainer) return console.error('avatar container is null');

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
		}, Math.max(message?.length * 500, 5000));
	}
	showCamera(track: RemoteVideoTrack) {
		if (!this.avatarContainer) return console.error('avatar container is null');

		const video = document.createElement('a-circle');
		video.setAttribute('material', 'src:#' + track.sid + ';shader:flat;side:double;');
		video.setAttribute('id', 'cameraCircleOf' + this.id);
		video.setAttribute('position', '0 1.6 -0.3');
		video.setAttribute('rotation', '0 180 0');
		video.setAttribute('radius', '0.2');
		video.classList.add('clickable');

		this.avatarContainer.appendChild(video);
	}
	async showScreen(track: RemoteVideoTrack | LocalVideoTrack, sid: string): Promise<void> {
		const video = document.createElement('a-plane');
		const sharedObject = new SharedObject({
			id: 'screenPlaneOf' + this.id,
			locked: this.id != videoChat.userId,
			title: 'Shared Screen',
			type: 'screen'
		});
		sharedObjects.add(sharedObject);
		sharedObject.inPreviewPane = true;
		sharedObject.el = video;

		video.setAttribute('id', 'screenPlaneOf' + this.id);
		video.setAttribute('rotation', `0 ${this.rotation.y} 0`);
		video.setAttribute('material', 'src:#' + sid + ';shader: flat; side:double');
		video.setAttribute('editable-object', '');
		video.setAttribute('width', '1');
		if (track.dimensions?.width && track.dimensions?.height) {
			video.setAttribute('height', (track.dimensions?.height / track.dimensions?.width).toString());
		}
		//send ping only when the screen is mine
		if (this.id == videoChat.userId) {
			const vector = new THREE.Vector3(0, 0, -2);
			vector.applyAxisAngle(new THREE.Vector3(0, 1, 0), degree2radian(this.rotation.y));
			video.setAttribute(
				'position',
				`${this.position.x + vector.x} ${this.position.y + 1.65} ${this.position.z + vector.z}`
			);
			setTimeout(() => {
				videoChat.sendMessage({
					key: 'objectPosition',
					object: {
						id: video.id
					},
					position: video.getAttribute('position'),
					rotation: video.getAttribute('rotation'),
					scale: video.getAttribute('scale'),
					radius: video.getAttribute('geometry')?.radius
				});
			}, 3000);

			videoChat.screenPingInterval = new sessionPing(
				{
					instanceId: sid,
					user: this.id,
					type: 'screen',
					room: room.id
				},
				video
			);
			videoChat.screenPingInterval.start();
		} else {
			// this is someone elses screen, thus get the position from db
			//maybe wait for a second
			setTimeout(async () => {
				const session = await axios
					.get('/api/sessions?instanceId=' + sid)
					.then((res) => res.data[0]);
				const parsedComponents = JSON.parse(session.components);
				if (parsedComponents) {
					video.setAttribute('position', parsedComponents.position);
					video.setAttribute('rotation', parsedComponents.rotation);
					video.setAttribute('scale', parsedComponents.scale);
				}
			}, 1000);
		}
		const scene: Entity = document.querySelector('a-scene');
		scene?.appendChild(video);
	}
	hideScreen() {
		const sharedObject = sharedObjects.get('screenPlaneOf' + this.id);
		sharedObject?.remove();
		sharedObjects.remove('screenPlaneOf' + this.id);
	}
	hideCamera() {
		const video = document.getElementById('cameraCircleOf' + this.id);
		video?.parentNode?.removeChild(video);
	}
	attachAudio(track: RemoteAudioTrack) {
		if (!this.avatarContainer) return console.error('avatar container is null');

		pollAudioLevel(track, (level: number) => {
			/* Update audio level indicator. */
			this.audioLevel = level;
		});
		this.audioSid = track.sid;
		this.audioEl = document.getElementById(track.sid);

		// this.el.setAttribute('sound', {
		// 	src: '#' + track.sid,
		// 	autoplay: false,
		// 	positional: true
		// });
		this.el.setAttribute('move-mouth', 'userId:' + this.id);
	}
	detachAudio() {
		this.audioSid = '';
		this.audioEl = null;
		this.el.removeAttribute('sound');
	}
}
