import { unescapeHTML } from '$lib/math/escapeHTML';
import { RoomStore, ItemsInPreview, UserStore, type xyz } from '$lib/store';
import type { Entity } from 'aframe';
import type { LocalVideoTrack, RemoteAudioTrack, RemoteVideoTrack } from 'twilio-video';
import { videoChat } from './VideoChat';
import { sessionPing } from '$lib/frontend/Classes/sessionPing';
import type { Room } from './Room';
import { User } from '$lib/frontend/Classes/User';
import axios from 'axios';
import { degree2radian } from '$lib/math/degree2radians';
import { sharedObjects } from './SharedObjects';
import { pollAudioLevel } from '../pollAudioLevel';
import { SharedObject } from './SharedObject';
let room: Room;
RoomStore.subscribe((value) => {
	if (!value) return;
	room = value;
});

export class Unit {
	id: string;
	userId: string;
	el: Entity;
	avatar: Entity | null = null;
	avatarContainer: Entity;
	nicknameData: string = '';
	onMute: boolean = false;
	onVideoMute: boolean = false;
	sharingScreen: boolean = false;
	audioLevel: number = 0;
	userData: User;
	constructor(data: User) {
		this.userData = data;
		this.id = data.id;
		this.userId = data.id;
		//append element to the scene
		this.el = document.createElement('a-entity');
		this.el.id = data.id;
		this.avatarContainer = document.createElement('a-entity');
		this.avatarContainer.setAttribute('rotate-at-position', '');
		this.el.appendChild(this.avatarContainer);

		if (!this.avatar) {
			this.avatar = document.createElement('a-gltf-model');
			this.avatarContainer.appendChild(this.avatar);
			this.avatar.setAttribute('position', '0 0.9 0');
			this.avatar.setAttribute('rotation', '0 180 0');
			this.avatar.setAttribute('hand-position', '');
			this.avatar.setAttribute('smile', '');
		}
		this.avatar.setAttribute('src', data.avatarURL);
		this.avatarContainer.setAttribute('rotate-at-position', '');
		const scene = document.querySelector('a-scene');

		this.setNickname();
		scene?.appendChild(this.el);
	}
	get nickname(): string {
		return this.nicknameData;
	}
	setNickname() {
		if (this.userData.nicknameURL) {
			let asset: HTMLImageElement;
			const existingAsset = document.querySelector(`#${this.userData.id}nameTag`);
			if (existingAsset && existingAsset instanceof HTMLImageElement) {
				asset = existingAsset;
			} else {
				const el = document.createElement('img');
				if (el instanceof HTMLImageElement) {
					asset = el;
					asset.setAttribute('id', this.userData.id + 'nameTag');
					asset.setAttribute('crossorigin', 'anonymous');
					document.querySelector('a-assets')?.appendChild(asset);
					asset.onload = () => {
						//get aspect ratio
						console.log('asset loaded', asset);
						const width = asset.width;
						const height = asset.height;
						const aspectRatio = height / width;
						image.setAttribute('height', 0.2);
						image.setAttribute('width', 0.2 / aspectRatio);
					};
				}
			}
			asset.setAttribute('src', this.userData.nicknameURL);
			let image: Entity;
			const existingImage = this.el.querySelector('a-image');
			if (existingImage) {
				image = existingImage;
			} else {
				image = document.createElement('a-image');
				image.setAttribute('side', 'front');
				image.setAttribute('position', '0 1.85 0');
				image.setAttribute('rotation', '0 180 0');
				image.setAttribute('src', `#${this.userData.id}nameTag`);
				this.avatarContainer.appendChild(image);
			}
			console.log(asset);
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
		}, Math.max(message.length * 500, 5000));
	}
	showCamera(track: RemoteVideoTrack) {
		if (!this.avatarContainer) return console.error('avatar container is null');

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
		const sharedObject = {
			id: 'screenPlaneOf' + this.userId,
			locked: this.userId != videoChat.userId,
			title: 'Shared Screen',
			type: 'screen',
			el: video
		};
		console.log({ sharedObject });
		sharedObjects.add(sharedObject);
		sharedObject.inPreviewPane = true;

		video.setAttribute('id', 'screenPlaneOf' + this.userId);
		video.setAttribute('rotation', `0 ${this.rotation.y} 0`);
		video.setAttribute('material', 'src:#' + sid + ';shader: flat; side:double');
		video.setAttribute('editable-object', '');
		video.setAttribute('width', '1');
		if (track.dimensions?.width && track.dimensions?.height) {
			video.setAttribute('height', (track.dimensions?.height / track.dimensions?.width).toString());
		}
		//send ping only when the screen is mine
		if (this.userId == videoChat.userId) {
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
					user: this.userId,
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
				console.log({ session });
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
		const video = document.getElementById('screenPlaneOf' + this.userId);
		video?.parentNode?.removeChild(video);
	}
	hideCamera() {
		const video = document.getElementById('cameraCircleOf' + this.userId);
		video?.parentNode?.removeChild(video);
	}
	attachAudio(track: RemoteAudioTrack) {
		if (!this.avatarContainer) return console.error('avatar container is null');

		pollAudioLevel(track, (level: number) => {
			/* Update audio level indicator. */
			this.audioLevel = level;
		});
		const audio = document.createElement('a-entity') as Entity;
		audio.setAttribute(
			'sound',
			'src:#' +
				track.sid +
				'; autoplay : true; volume : 1; refDistance : 3; rolloffFactor : 1; maxDistance : 20;'
		);
		audio.setAttribute('position', '0 1.5 0');
		audio.setAttribute('rotation', '0 180 0');
		audio.setAttribute('move-mouth', 'userId:' + this.userId);
		this.avatarContainer.appendChild(audio);
	}
	detachAudio() {
		const audio = document.querySelector('a-entity[sound]');
		audio?.parentNode?.removeChild(audio);
	}
}
