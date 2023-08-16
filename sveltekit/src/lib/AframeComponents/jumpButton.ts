import type { Me } from '$lib/frontend/Classes/Me';
import { Users } from '$lib/frontend/Classes/Users';
import type { xyz } from '$lib/store';
import type { Entity } from 'aframe';

AFRAME.registerComponent('jump-button', {
	dragging: false as boolean,
	originalIntersection: null as xyz | null,
	currentIntersection: null as xyz | null,
	cursorEl: null as Entity | null,
	rig: null as Entity | null,
	schema: {
		userId: { default: '' }
	},
	init: function () {
		this.cursorEl = document.querySelector('[raycaster]');
		//ondrag, change position
		this.el.addEventListener('click', () => {
			const me = Users.find(this.data.userId) as Me;
			me.jump();
		});
		this.el.addEventListener('mousedown', (evt: any) => {
			this.rig = document.getElementById(this.data.userId) as Entity;

			console.log('mousedown', evt);
			this.dragging = true;
			this.rig.setAttribute('look-controls', 'enabled:false');

			this.originalIntersection = evt.detail?.intersection?.point;
		});
		this.el.addEventListener('mouseup', (evt: any) => {
			console.log('mouseup', evt);
			this.dragging = false;
			this.rig?.setAttribute('look-controls', 'enabled:true');
			this.originalIntersection = evt.detail?.intersection?.point;
		});
		this.el.addEventListener('touchstart', (evt) => {
			this.rig = document.getElementById(this.data.userId) as Entity;

			console.log('touchstart', evt);
			this.dragging = true;
			this.rig.setAttribute('look-controls', 'enabled:false');
		});
		this.el.addEventListener('touchend', (evt) => {
			console.log('touchend', evt);
			this.dragging = false;
			this.rig?.setAttribute('look-controls', 'enabled:true');
		});
	},
	tick: function () {
		if (!this.dragging || !this.cursorEl) return;
		var intersections = this.cursorEl.components.raycaster.intersections;
		if (intersections.length == 0) return;
		const intersection = intersections.find(
			(intersection: any) => intersection.object.el.id == 'jumpButton'
		)?.point;
		if (!intersection) return;
		//convert intersection to local coordinates
		if (!this.originalIntersection) return;
		const diff = {
			x: intersection.x - this.originalIntersection.x,
			y: intersection.y - this.originalIntersection.y
			//			z: intersection.z - this.originalIntersection.z
		};
		console.log({ diff });
		this.el.setAttribute(
			'position',
			`${this.el.getAttribute('position').x + diff.x}
              ${this.el.getAttribute('position').y + diff.y}
              ${this.el.getAttribute('position').z}`
		);
		this.originalIntersection = { ...intersection };
	}
});
