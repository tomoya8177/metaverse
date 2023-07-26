import { degree2radian } from '$lib/math/degree2radians';
import type { Entity } from 'aframe';
import { ItemsInPreview, type xyz } from '$lib/store';
import * as THREE from 'three';
type shortType = 'image' | 'video' | 'model';

export class SharedObject {
	id: string;
	url: string = '';
	type: string = '';
	size?: number;
	title: string = '';
	createdAt?: string;
	components: string = '';
	event: string = '';
	user: string = '';
	editable: boolean = false;
	handle?: string;
	el: Entity | null = null;
	locked: boolean = true;
	linkTo: string = '';
	isSphere: boolean = false;
	inPreviewPane: boolean = false;
	scene: Entity | null = null;
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
		let asset: Entity | null = null;
		if (shortType != 'model') {
			asset = this.createAsset(shortType);
		}
		if (!asset) return;
		entity = this.setEntityGeometry(entity, shortType);
		if (shortType == 'image') {
			entity = this.setEntityMaterial(entity, asset);
			if (!this.isSphere) {
				asset.onload = () => {
					if (!asset) return console.error('asset is null');
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
					if (!asset) return console.error('asset is null');
					const width = asset.videoWidth;
					const height = asset.videoHeight;
					const aspectRatio = height / width;
					entity.setAttribute('geometry', { height: aspectRatio, width: 1 });
				});
			}
		} else if (shortType == 'model') {
			entity.setAttribute('gltf-model', `url(${this.url})`);
		}

		if (shortType != 'model') {
			document.querySelector('a-assets')?.appendChild(asset);
		}
		entity.setAttribute('position', `${this.position.x} ${this.position.y} ${this.position.z}`);
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
		this.scene.appendChild(entity);
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
	cloneToPreviewPane = () => {
		this.inPreviewPane = true;
		ItemsInPreview.update((items) => [...items, this]);
		setTimeout(() => {
			if (!this.el) return;
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
