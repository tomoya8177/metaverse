import { FocusObjectStore } from '$lib/store';
import type { Entity } from 'aframe';
import { videoChat } from './VideoChat';

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
		this.el = entity;
		this.id = entity?.id || '';
		FocusObjectStore.set({
			open: false,
			el: this.el,
			name: this.el?.tagName.replace('A-', '') || '',
			id: this.el?.id || ''
		});
	}
	openMenu() {
		FocusObjectStore.set({
			open: true,
			el: this.el,
			name: this.el?.tagName.replace('A-', '') || '',
			id: this.el?.id || ''
		});
	}
	remove() {
		this.el.parentNode?.removeChild(this.el);
		FocusObjectStore.set({
			open: false,
			el: null,
			name: '',
			id: ''
		});
	}
}
export const editableObject = new EditableObject();
