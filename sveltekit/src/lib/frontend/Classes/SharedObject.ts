import { degree2radian } from '$lib/math/degree2radians';
import type { Entity } from 'aframe';
import { sharedObjects } from './SharedObjects';
import { ItemsInPreview } from '$lib/store';
type shortType = 'image' | 'video' | 'model';

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
	isSphere: boolean = false;
	inPreviewPane: boolean = false;
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
		this.isSphere = data.isSphere;
		console.log('start construction', this.id);
		let entity = document.createElement('a-entity') as Entity;
		entity.setAttribute('id', this.id);
		let shortType: shortType = 'image';
		if (this.type.includes('image')) {
			shortType = 'image';
		} else if (this.type.includes('video')) {
			shortType = 'video';
		} else if (this.type.includes('glb') || this.type.includes('gltf')) {
			shortType = 'model';
		}
		let asset: Entity | null = null;
		if (shortType != 'model') {
			asset = this.createAsset(shortType);
		}
		entity = this.setEntityGeometry(entity, shortType);
		if (shortType == 'image') {
			entity = this.setEntityMaterial(entity, asset);
			if (!this.isSphere) {
				asset.onload = () => {
					const width = asset.width;
					const height = asset.height;
					const aspectRatio = height / width;
					entity.setAttribute('geometry', { height: aspectRatio, width: 1 });
				};
			}
		} else if (shortType == 'video') {
			entity = this.setEntityMaterial(entity, asset);
			if (!this.isSphere) {
				asset.addEventListener('loadedmetadata', () => {
					const width = asset.videoWidth;
					const height = asset.videoHeight;
					const aspectRatio = height / width;
					entity.setAttribute('geometry', { height: aspectRatio, width: 1 });
				});
			}
		} else if (shortType == 'model') {
			entity.setAttribute('gltf-model', `url(${this.url})`);
		}
		console.log(0, { entity, asset });

		if (shortType != 'model') {
			document.querySelector('a-assets')?.appendChild(asset);
		}
		entity.setAttribute('position', `${this.position.x} ${this.position.y} ${this.position.z}`);
		if (this.isSphere) {
			entity.setAttribute('rotation', `0 ${this.rotation.y} 0`);
			entity.setAttribute('scale', `-1 1 1`);
		} else {
			entity.setAttribute('rotation', `${this.rotation.x} ${this.rotation.y} ${this.rotation.z}`);
			entity.setAttribute('scale', `${this.scale.x} ${this.scale.y} ${this.scale.z}`);
		}
		entity.setAttribute('name', this.title);
		entity.setAttribute('editable-object', '');
		if (this.editable) {
			entity.classList.add('clickable');
		}
		console.log({ entity, asset }, this.isSphere);
		scene.appendChild(entity);
		this.el = entity;
		console.log('finished construction');
	}
	createAsset(type: 'image' | 'video') {
		const asset = document.createElement(type == 'image' ? 'img' : 'video') as Entity;
		asset.id = this.id + 'asset';
		asset.src = this.url;
		asset.crossOrigin = 'anonymous';
		if (type == 'video') {
			asset.autoplay = true;
			asset.playsinline = true;
			asset['webkit-playsinline'] = true;
		}

		return asset;
	}
	setEntityGeometry(entity: Entity, type: shortType) {
		switch (type) {
			case 'image':
			case 'video':
				if (this.isSphere) {
					entity.setAttribute('geometry', `primitive: sphere;radius:${this.radius || 0.5};`);
					//flip the material
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
	setEntityMaterial(entity: Entity, asset: Entity) {
		entity.setAttribute(
			'material',
			`src: #${asset.id}; shader:flat;side: double;transparent: true`
		);
		return entity;
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
		scene.removeChild(entity);
	}
	moveToMyFront(eyePosition, eyeRotation) {
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
	cloneToPreviewPane = () => {
		this.inPreviewPane = true;
		ItemsInPreview.update((items) => [...items, this]);
		setTimeout(() => {
			let asset;
			asset = this.el.components.material.data.src;
			const li = document.getElementById(this.id + '_preview');
			const clonedAsset = asset.cloneNode();
			li?.appendChild(clonedAsset);
			if (this.type.includes('video')) {
				clonedAsset.controls = true;
				clonedAsset.muted = true;
			}
		}, 100);
	};
}
