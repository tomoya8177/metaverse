import type { xyz } from '$lib/store';
import type { Entity } from 'aframe';
export class Unit {
	userId: string;
	el: Entity;
	avatar: Entity | undefined;
	avatarContainer: Entity | undefined;
	nicknameData: string = '';
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
}
