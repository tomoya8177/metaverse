import { unescapeHTML } from '$lib/escapeHTML';
import type { xyz } from '$lib/store';
import type { Entity } from 'aframe';
import type { RemoteVideoTrack } from 'twilio-video';
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
			text.setAttribute('side', 'double');
			text.setAttribute('align', 'center');
			this.avatarContainer.appendChild(text);
		}
		text.setAttribute('value', nickname);
	}

	set avatarURL(avatarURL: string) {
		if (!this.avatar) {
			this.avatar = document.createElement('a-gltf-model');
			this.avatarContainer.appendChild(this.avatar);
		}
		this.avatar.setAttribute('src', avatarURL);
		this.avatar.setAttribute('position', '0 0.9 0');
		this.avatar.setAttribute('rotation', '0 180 0');
		this.avatar.setAttribute('hand-position', '');
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
		video.setAttribute('dragndrop', '');
		this.avatarContainer.appendChild(video);
	}
	showScreen(track: RemoteVideoTrack) {
		console.log({ track });
		const video = document.createElement('a-plane');
		video.setAttribute('side', 'double');
		video.setAttribute('id', 'screenPlaneOf' + this.userId);
		video.setAttribute('position', '0 2 -0.35');
		video.setAttribute('rotation', '0 180 0');
		video.setAttribute('width', '1');
		video.setAttribute('material', 'src:#' + track.sid + ';shader: flat; side:double');
		console.log(track.dimensions);
		if (track.dimensions?.width && track.dimensions?.height) {
			video.setAttribute('height', (track.dimensions?.height / track.dimensions?.width).toString());
		}
		this.avatarContainer.appendChild(video);

		const screenTransformer = document.createElement('a-entity');
		for (let i = 0; i < 2; i++) {
			const cone = document.createElement('a-cone');
			const offsetter = document.createElement('a-entity');
			const offsetAmount = Number(video.getAttribute('height')) / 2 + 0.2;
			cone.setAttribute('color', 'yellow');
			cone.setAttribute('position', '0 ' + offsetAmount + ' 0');
			cone.setAttribute('radius-bottom', '0.1');
			cone.setAttribute('radius-top', '0');
			cone.setAttribute('height', '0.2');
			cone.classList.add('clickable');
			const direction = i ? 'down' : 'up';
			cone.setAttribute('click-to-move-screen', 'direction:' + direction);
			offsetter.appendChild(cone);

			offsetter.setAttribute('rotation', '0 0 ' + i * 180);
			screenTransformer.appendChild(offsetter);

			const button = document.createElement('a-entity');
			button.setAttribute('geometry', 'primitive:plane;width:0.3;height:0.15');
			button.setAttribute('material', 'color:yellow;shader:flat;side:double;');
			const text = i ? 'Shrink' : 'Enlarge';
			button.setAttribute('text', 'value:' + text + '; width:1.2; align:center;color:black');
			button.setAttribute('click-to-resize-screen', 'direction:' + direction);
			button.classList.add('clickable');
			const xOffset = i ? 0.3 : -0.3;
			button.setAttribute('position', xOffset.toString() + ' ' + offsetAmount + ' 0');
			screenTransformer.appendChild(button);
		}
		video.appendChild(screenTransformer);
	}
	hideScreen() {
		const video = document.getElementById('screenPlaneOf' + this.userId);
		video?.parentNode?.removeChild(video);
	}
	hideCamera() {
		const video = document.getElementById('cameraCircleOf' + this.userId);
		video?.parentNode?.removeChild(video);
	}
}
