import type { Me } from '$lib/frontend/Classes/Me';
import { Users } from '$lib/frontend/Classes/Users';
import type { xyz } from '$lib/store';
import type { Entity } from 'aframe';
import type { Vector3 } from 'three';

AFRAME.registerComponent('jump-button', {
	dragging: false as boolean,
	originalIntersection: null as Vector3 | null,
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
			if (!this.rig) return;

			this.dragging = true;
			this.rig.setAttribute('look-controls', 'enabled:false');

			this.originalIntersection = evt.detail?.intersection?.point;
			//conver to world to local position
			if (this.originalIntersection) {
				this.originalIntersection = this.rig.object3D.worldToLocal(
					new THREE.Vector3(
						this.originalIntersection.x,
						this.originalIntersection.y,
						this.originalIntersection.z
					)
				);
			}
		});
		this.el.addEventListener('mouseup', (evt: any) => {
			this.dragging = false;
			if (!this.rig) return;

			this.rig.setAttribute('look-controls', 'enabled:true');
		});
		this.el.addEventListener('touchstart', (evt: any) => {
			this.rig = document.getElementById(this.data.userId) as Entity;

			this.dragging = true;
			this.rig.setAttribute('look-controls', 'enabled:false');
			this.originalIntersection = evt.detail?.intersection?.point;
			if (this.originalIntersection) {
				this.originalIntersection = this.rig.object3D.worldToLocal(
					new THREE.Vector3(
						this.originalIntersection.x,
						this.originalIntersection.y,
						this.originalIntersection.z
					)
				);
			}
		});
		this.el.addEventListener('touchend', (evt) => {
			this.dragging = false;
			if (!this.rig) return;
			this.rig.setAttribute('look-controls', 'enabled:true');
		});
	},
	tick: function () {
		if (!this.dragging || !this.cursorEl || !this.rig) return;
		var intersections = this.cursorEl.components.raycaster.intersections;
		if (intersections.length == 0) return;
		let intersection: Vector3 = intersections.find(
			(intersection: any) => intersection.object.el.id == 'jumpButton'
		)?.point;
		if (!intersection) return;

		intersection = this.rig.object3D.worldToLocal(
			new THREE.Vector3(intersection.x, intersection.y, intersection.z)
		);
		//convert intersection to local coordinates
		if (!this.originalIntersection) return;

		const diff = {
			x: intersection.x - this.originalIntersection.x,
			y: intersection.y - this.originalIntersection.y
			//			z: intersection.z - this.originalIntersection.z
		};
		//if diff is too large, something wrong.
		if (Math.abs(diff.x) > 0.1 || Math.abs(diff.y) > 0.1) return;

		this.el.setAttribute(
			'position',
			`${this.el.getAttribute('position').x + diff.x}
              ${this.el.getAttribute('position').y + diff.y}
              ${this.el.getAttribute('position').z}`
		);
		this.originalIntersection = new THREE.Vector3(intersection.x, intersection.y, intersection.z);
	}
});
