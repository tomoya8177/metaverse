import { degree2radian } from '$lib/math/degree2radians';
import type { Entity } from 'aframe';
import type { xyz } from '$lib/store';
import { getPositionFromLockedPosition } from '../getPositionFromLockedPosition';
import { myAlert } from '../toast';
import { _ } from '$lib/i18n';
import { DBObject } from './DBObject';
type shortType = 'image' | 'video' | 'model' | 'screen';

//export class SharedObject extends DBObject {
export class SharedObject extends DBObject {
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
	description: string = '';
	explained: boolean = false;
	iconURL?: string = '';
	withCaption: boolean = false;
	captionUrl: string = '';
	captionAsset: Entity | null = null;
	captionEl: Entity | null = null;
	constructor(data: any = {}) {
		data.table = 'objects';
		super(data);
		this.url = data.url;
		this.type = data.type || '';
		this.size = data.size || 1;
		this.title = data.title || '';
		this.createdAt = data.createdAt || '';
		this.withCaption = data.withCaption || false;
		this.captionUrl = data.captionUrl || '';
		this.components =
			data.components ||
			JSON.stringify({
				position: {
					x: 0,
					y: 0,
					z: 0
				},
				rotation: {
					x: 0,
					y: 0,
					z: 0
				},
				scale: {
					x: 1,
					y: 1,
					z: 1
				},
				radius: 0.5
			});
		this.room = data.room || '';
		this.user = data.user || '';
		this.editable = data.editable || false;
		this.handle = data.handle || '';
		this.linkTo = data.linkTo || '';
		this.isSphere = data.isSphere || false;
		this.description = data.description || '';
		this.lockedPosition = data.lockedPosition || 0;
	}
	refreshPreview() {
		this.remove();
		setTimeout(() => {
			this.attachElement();
		}, 1000);
	}
	attachElement() {
		this.el = document.createElement('a-entity') as Entity;
		this.scene = document.querySelector('a-scene');
		this.el.setAttribute('id', this.id);
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
			if (this.type.includes('image') && this.withCaption && !!this.captionUrl) {
				this.captionAsset = this.createCaptionAsset();
			}
			if (!this.asset) return;
		}
		if (this.url) this.setEntityGeometry(this.el, shortType);
		if (shortType == 'image' && this.asset) {
			if (this.url) this.setEntityMaterial(this.el, this.asset);
			if (!this.isSphere) {
				if (this.withCaption && !!this.captionUrl && this.captionAsset) {
					this.captionEl = document.createElement('a-image') as Entity;
					this.captionEl.setAttribute('src', '#' + this.captionAsset.id);
					this.el.appendChild(this.captionEl);
					this.captionAsset.onload = () => {
						this.setCaptionImageAspectRatio();
					};
				}
				this.asset.onload = () => {
					this.setImageAspectRatio();
				};
			}
		} else if (shortType == 'video' && this.asset) {
			this.setEntityMaterial(this.el, this.asset);
			if (!this.isSphere) {
				this.asset.addEventListener('loadedmetadata', () => {
					this.setVideoAspectRatio();
				});
			}
		} else if (shortType == 'model') {
			this.el.setAttribute('gltf-model', `url(${this.url})`);
		}

		if (shortType != 'model' && this.asset) {
			document.querySelector('a-assets')?.appendChild(this.asset);
		}
		if (shortType != 'model' && this.captionAsset) {
			document.querySelector('a-assets')?.appendChild(this.captionAsset);
		}
		if (this.lockedPosition) {
			const position = getPositionFromLockedPosition(this.lockedPosition);

			this.el.setAttribute('position', `${position.x} ${this.position.y} ${position.z}`);
		} else {
			this.el.setAttribute('position', `${this.position.x} ${this.position.y} ${this.position.z}`);
		}
		if (this.isSphere) {
			this.el.setAttribute('rotation', `0 ${this.rotation.y} 0`);
			this.el.setAttribute('scale', `-1 1 1`);
		} else {
			this.el.setAttribute('rotation', `${this.rotation.x} ${this.rotation.y} ${this.rotation.z}`);
			this.el.setAttribute('scale', `${Math.abs(this.scale.x)} ${this.scale.y} ${this.scale.z}`);
		}
		this.el.setAttribute('name', this.title);
		this.el.setAttribute('editable-object', '');
		if (this.editable) {
			this.el.classList.add('clickable');
		}
		this.scene?.appendChild(this.el);
		console.log({ entity: this.el });
	}
	setImageAspectRatio() {
		if (!this.asset || !this.el) return console.error('asset is null');
		const width = this.asset.width;
		const height = this.asset.height;
		const aspectRatio = height / width;
		this.el.setAttribute('geometry', { height: aspectRatio, width: 1 });
		if (this.withCaption && !!this.captionUrl && this.captionEl) {
			this.captionEl.object3D.position.y -= aspectRatio / 2;
		}
	}
	setCaptionImageAspectRatio() {
		if (!this.captionAsset || !this.captionEl) return console.error('captionAsset is null');
		const width = this.captionAsset.width;
		const height = this.captionAsset.height;
		const aspectRatio = height / width;
		this.captionEl.setAttribute('height', aspectRatio);
		this.captionEl.object3D.position.y -= aspectRatio / 2;
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
	createCaptionAsset(): Entity {
		const asset = document.createElement('img') as Entity;
		asset.id = this.id + 'captionAsset';
		asset.setAttribute('src', this.captionUrl);
		asset.setAttribute('crossOrigin', 'anonymous');
		return asset;
	}
	setEntityGeometry(entity: Entity, type: shortType) {
		switch (type) {
			case 'image':
			case 'video':
				if (this.isSphere) {
					this.el?.setAttribute('geometry', `primitive: sphere;radius:${this.radius || 0.5};`);
				} else {
					this.el?.setAttribute('geometry', `primitive: plane;`);
				}
				break;
			case 'model':
				this.el?.setAttribute('gltf-model', `url(${this.url})`);

				break;
		}
	}
	setEntityMaterial(entity: Entity, asset: Entity): Entity {
		this.el?.setAttribute(
			'material',
			`src: #${asset.id}; shader:flat;side: double;transparent: true`
		);
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
		this.el?.parentNode?.removeChild(this.el);
		this.asset?.parentNode?.removeChild(this.asset);
		this.captionAsset?.parentNode?.removeChild(this.captionAsset);
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
	validate(): boolean {
		if (this.title == '') {
			myAlert(_('Please enter a title.'));
			return false;
		}
		return true;
	}

	//this is not working why?? @copilot
}
