import { FocusObjectStore } from '$lib/store';
import type { Entity } from 'aframe';
import { videoChat } from './VideoChat';
import { sharedObjects } from './SharedObjects';

class EditableObject {
	el: Entity | null = null;
	name: string = '';
	id: string = '';
	transportMode: 'position' | 'rotation' | 'scale' = 'position';
	constructor() {
		window.addEventListener('keydown', (evt) => {
			if (evt.key == 'Shift') {
				//rotation
				this.transportMode = 'rotation';
			} else if (evt.key == 'Control') {
				//scale
				this.transportMode = 'scale';
			} else if (evt.key == 'Escape') {
				console.log('escape');
				//scale
				this.transportMode = 'position';
				this.setEntity(null);
			}
		});
		window.addEventListener('keyup', (evt) => {
			if (evt.key == 'Shift') {
				//rotation
				this.transportMode = 'position';
			} else if (evt.key == 'Control') {
				//scale
				this.transportMode = 'position';
			}
		});
	}

	setEntity(entity: Entity) {
		console.log('setting entity');
		this.el = entity;
		this.id = entity?.id || '';
		const file = sharedObjects.get(this.id);
		FocusObjectStore.set({
			file: file,
			open: false,
			el: this.el,
			name: this.el.getAttribute('name') || this.el?.tagName.replace('A-', '') || '',
			id: this.el?.id || ''
		});
	}
}
export const editableObject = new EditableObject();
