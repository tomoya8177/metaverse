import { degree2radian } from '$lib/math/degree2radians';
import type { Entity } from 'aframe';
import type { xyz } from '$lib/store';
import { getPositionFromLockedPosition } from '../getPositionFromLockedPosition';
type shortType = 'image' | 'video' | 'model' | 'screen';

export class SharedObject {
	id: string;
	url: string = '';
	type: string = '';
	size?: number;
	title: string = '';
	createdAt?: string;
	components: string = '';
	room: string = '';
	user: string = '';
	editable: boolean = false;
	handle?: string;
	el: Entity | null = null;
	locked: boolean = true;
	linkTo: string = '';
	isSphere: boolean = false;
	inPreviewPane: boolean = false;
	scene: Entity | null = null;
	asset: Entity | null = null;
	shortType: shortType = 'image';
	lockedPosition: number;
	constructor(data: any) {
		this.id = data.id;
		if (!this.id) return;
		this.url = data.url;
		this.type = data.type || '';
		this.size = data.size;
		this.title = data.title;
		this.createdAt = data.createdAt;
		this.components = data.components;
		this.room = data.room;
		this.user = data.user;
		this.editable = data.editable;
		this.handle = data.handle;
		this.linkTo = data.linkTo;
		this.isSphere = data.isSphere;
		this.lockedPosition = data.lockedPosition || 0;
		let entity = document.createElement('a-entity') as Entity;
		this.el = entity;
		this.scene = document.querySelector('a-scene');
		entity.setAttribute('id', this.id);
		let shortType: shortType = 'image';
		if (this.type.includes('image')) {
			shortType = 'image';
		} else if (this.type.includes('video')) {
			shortType = 'video';
		} else if (this.type.includes('glb') || this.type.includes('gltf')) {
			shortType = 'model';
		}
		this.shortType = shortType;
		if (shortType != 'model') {
			this.asset = this.createAsset(shortType);
			if (!this.asset) return;
		}
		entity = this.setEntityGeometry(entity, shortType);
		if (shortType == 'image' && this.asset) {
			entity = this.setEntityMaterial(entity, this.asset);
			if (!this.isSphere) {
				this.asset.onload = () => {
					this.setImageAspectRatio();
				};
			}
		} else if (shortType == 'video' && this.asset) {
			entity = this.setEntityMaterial(entity, this.asset);
			if (!this.isSphere) {
				this.asset.addEventListener('loadedmetadata', () => {
					this.setVideoAspectRatio();
				});
			}
		} else if (shortType == 'model') {
			entity.setAttribute('gltf-model', `url(${this.url})`);
		}

		if (shortType != 'model' && this.asset) {
			document.querySelector('a-assets')?.appendChild(this.asset);
		}
		if (this.lockedPosition) {
			const position = getPositionFromLockedPosition(this.lockedPosition);

			entity.setAttribute('position', `${position.x} ${this.position.y} ${position.z}`);
		} else {
			entity.setAttribute('position', `${this.position.x} ${this.position.y} ${this.position.z}`);
		}
		if (this.isSphere) {
			entity.setAttribute('rotation', `0 ${this.rotation.y} 0`);
			entity.setAttribute('scale', `-1 1 1`);
		} else {
			entity.setAttribute('rotation', `${this.rotation.x} ${this.rotation.y} ${this.rotation.z}`);
			entity.setAttribute('scale', `${Math.abs(this.scale.x)} ${this.scale.y} ${this.scale.z}`);
		}
		entity.setAttribute('name', this.title);
		entity.setAttribute('editable-object', '');
		if (this.editable) {
			entity.classList.add('clickable');
		}
		this.scene?.appendChild(entity);
	}
	setImageAspectRatio() {
		if (!this.asset || !this.el) return console.error('asset is null');
		const width = this.asset.width;
		const height = this.asset.height;
		const aspectRatio = height / width;
		this.el.setAttribute('geometry', { height: aspectRatio, width: 1 });
	}
	setVideoAspectRatio() {
		if (!this.asset || !this.el) return console.error('asset is null');
		const width = this.asset.videoWidth;
		const height = this.asset.videoHeight;
		const aspectRatio = height / width;
		this.el.setAttribute('geometry', { height: aspectRatio, width: 1 });
	}

	createAsset(type: 'image' | 'video'): Entity {
		const asset = document.createElement(type == 'image' ? 'img' : 'video') as Entity;
		asset.id = this.id + 'asset';
		asset.setAttribute('src', this.url);
		asset.setAttribute('crossOrigin', 'anonymous');
		if (type == 'video') {
			asset.setAttribute('autoplay', 'true');
			asset.setAttribute('playsinline', 'true');
			asset.setAttribute('webkit-playsinline', 'true');
		}

		return asset;
	}
	setEntityGeometry(entity: Entity, type: shortType) {
		switch (type) {
			case 'image':
			case 'video':
				if (this.isSphere) {
					entity.setAttribute('geometry', `primitive: sphere;radius:${this.radius || 0.5};`);
				} else {
					entity.setAttribute('geometry', `primitive: plane;`);
				}
				break;
			case 'model':
				entity.setAttribute('gltf-model', `url(${this.url})`);

				break;
		}
		return entity;
	}
	setEntityMaterial(entity: Entity, asset: Entity): Entity {
		entity.setAttribute(
			'material',
			`src: #${asset.id}; shader:flat;side: double;transparent: true`
		);
		return entity;
	}
	updateEntityGeometryAndMaterial() {
		if (!this.asset || !this.el) return;
		this.setEntityGeometry(this.el, this.shortType);
		this.setEntityMaterial(this.el, this.asset);
		if (this.shortType == 'image') {
			this.setImageAspectRatio();
		} else if (this.shortType == 'video') {
			this.setVideoAspectRatio();
		}
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
	get radius() {
		if (this.components) {
			return JSON.parse(this.components).radius;
		} else {
			return 0.5;
		}
	}
	remove() {
		const entity = document.getElementById(this.id);
		if (!entity) return;
		this.scene?.removeChild(entity);
	}
	moveToMyFront(eyePosition: xyz, eyeRotation: xyz) {
		this.el?.setAttribute('rotation', `0 ${eyeRotation.y} 0`);
		const vector = new THREE.Vector3(0, 0, -2);
		vector.applyAxisAngle(new THREE.Vector3(0, 1, 0), degree2radian(eyeRotation.y));
		this.el?.setAttribute(
			'position',
			`${eyePosition.x + vector.x} ${eyePosition.y + 1.65} ${eyePosition.z + vector.z}`
		);
	}

	//this is not working why?? @copilot
}
