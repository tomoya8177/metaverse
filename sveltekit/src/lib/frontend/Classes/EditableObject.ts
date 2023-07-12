import { FocusObjectStore } from '$lib/store';
import type { Entity } from 'aframe';
import { videoChat } from './VideoChat';

class EditableObject {
	el: Entity | null = null;
	scale: number = 1;
	rotation: number = 0;
	name: string = '';
	x: number = 0;
	scaleX: number = 1;
	setEntity(entity: Entity) {
		this.el = entity;
		this.rotation = entity.getAttribute('rotation').y;
		this.scale = entity.getAttribute('scale').x;
	}
	openMenu() {
		FocusObjectStore.set({
			open: true,
			el: this.el,
			name: this.el?.name || ''
		});
	}
	onScaleUpdate(scale: number) {
		const targetScale = this.scale * scale;
		this.el?.setAttribute('scale', `${targetScale} ${targetScale} ${targetScale}`);
	}
	onScaleUpdated() {
		this.scale = this.el?.getAttribute('scale').x;
		videoChat.sendMessage({
			key: 'objectPosition',
			object: {
				id: this.el.id
			},
			position: this.el.getAttribute('position'),
			rotation: this.el.getAttribute('rotation'),
			scale: this.el.getAttribute('scale')
		});
	}
	onRotationUpdate(y: number) {
		const targetRotation = y + this.rotation;
		this.el?.setAttribute('rotation', `0 ${targetRotation} 0`);
	}
	onRotationUpdated() {
		this.rotation = this.el.getAttribute('rotation').y;
		videoChat.sendMessage({
			key: 'objectPosition',
			object: {
				id: this.el.id
			},
			position: this.el.getAttribute('position'),
			rotation: this.el.getAttribute('rotation'),
			scale: this.el.getAttribute('scale')
		});
	}
}
export const editableObject = new EditableObject();
