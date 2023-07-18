import { degree2radian } from '$lib/math/degree2radians';
import type { Entity } from 'aframe';
export class SharedObject {
	id: string;
	url: string;
	type: string;
	size?: number;
	title: string;
	createdAt?: string;
	components: string;
	event: string;
	user: string;
	editable: boolean;
	handle?: string;
	el?: Entity;
	locked: boolean = true;
	linkTo: string;
	constructor(data: any) {
		this.id = data.id;
		if (!this.id) return;
		this.url = data.url;
		this.type = data.type || '';
		this.size = data.size;
		this.title = data.title;
		this.createdAt = data.createdAt;
		this.components = data.components;
		this.event = data.event;
		this.user = data.user;
		this.editable = data.editable;
		this.handle = data.handle;
		this.linkTo = data.linkTo;
		const entity = document.createElement('a-entity');
		entity.setAttribute('id', this.id);
		let asset: Entity | null = null;
		if (this.type.includes('image')) {
			asset = document.createElement('img');
			asset.onload = () => {
				console.log('loaded', asset);
				const width = asset.width;
				const height = asset.height;
				const aspectRatio = height / width;
				entity.setAttribute('geometry', { height: aspectRatio, width: 1 });
			};
		} else if (this.type.includes('video')) {
			asset = document.createElement('video');
			asset.autoplay = true;
			asset.playsinline = true;
			asset['webkit-playsinline'] = true;
			// const width = asset.width;
			// const height = asset.height;
			// const aspectRatio = height / width;
			// entity.setAttribute('geometry', `height:${aspectRatio}; width:1;`);
			asset.addEventListener('loadedmetadata', () => {
				console.log('loaded', asset);
				const width = asset.videoWidth;
				const height = asset.videoHeight;
				const aspectRatio = height / width;
				console.log({ aspectRatio });
				entity.setAttribute('geometry', { primitive: 'plane', height: aspectRatio, width: 1 });
			});
		}
		asset.id = this.id + 'asset';
		asset.src = this.url;
		asset.crossOrigin = 'anonymous';
		entity.setAttribute('geometry', `primitive: plane;`);
		entity.setAttribute(
			'material',
			`src: #${asset.id}; shader:flat;side: double;transparent: true`
		);
		if (!asset) return;
		document.querySelector('a-assets')?.appendChild(asset);
		entity.setAttribute('position', `${this.position.x} ${this.position.y} ${this.position.z}`);
		entity.setAttribute('rotation', `${this.rotation.x} ${this.rotation.y} ${this.rotation.z}`);
		entity.setAttribute('scale', `${this.scale.x} ${this.scale.y} ${this.scale.z}`);
		entity.setAttribute('name', this.title);
		entity.setAttribute('editable-object', '');
		if (this.editable) {
			entity.classList.add('clickable');
		}
		scene.appendChild(entity);
		this.el = entity;
	}
	get position() {
		if (this.components) {
			return JSON.parse(this.components).position;
		} else {
			return { x: 0, y: 0, z: 0 };
		}
	}
	get rotation() {
		if (this.components) {
			return JSON.parse(this.components).rotation;
		} else {
			return { x: 0, y: 0, z: 0 };
		}
	}
	get scale() {
		if (this.components) {
			return JSON.parse(this.components).scale;
		} else {
			return { x: 1, y: 1, z: 1 };
		}
	}
	remove() {
		const entity = document.getElementById(this.id);
		if (!entity) return;
		scene.removeChild(entity);
	}
	moveToMyFront(eyePosition, eyeRotation) {
		console.log({ eyePosition, eyeRotation });
		//move this object to eyesPosition and move away from the eyes by 2 meters.
		this.el?.setAttribute('rotation', `0 ${eyeRotation.y} 0`);
		//translate the object to the direction of the eye
		const vector = new THREE.Vector3(0, 0, -2);
		vector.applyAxisAngle(new THREE.Vector3(0, 1, 0), degree2radian(eyeRotation.y));
		this.el?.setAttribute(
			'position',
			`${eyePosition.x + vector.x} ${eyePosition.y + 1.65} ${eyePosition.z + vector.z}`
		);
	}
}
