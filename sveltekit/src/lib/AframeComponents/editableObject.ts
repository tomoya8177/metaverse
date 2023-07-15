import { editableObject } from '$lib/frontend/Classes/EditableObject';
import { videoChat } from '$lib/frontend/Classes/VideoChat';
import { FocusObjectStore, UserStore } from '$lib/store';
import 'aframe';
import { scale } from 'svelte/transition';
let userId = '';
UserStore.subscribe((user) => {
	userId = user.id;
});

AFRAME.registerComponent('editable-object', {
	init: function () {
		this.state = 'idle';
		this.initialPos = null;
		this.cursorEl = document.querySelector('[raycaster]');
		this.rayCatcher = document.getElementById('rayCatcher');

		this.el.addEventListener('mousedown', (e) => {
			editableObject.transportMode = 'position';
			this.camera = document.getElementById('camera');
			this.rig = document.getElementById(userId);
			editableObject.setEntity(this.el);
			const intersection = e.detail.intersection.point;
			this.rayCatcher.setAttribute(
				'position',
				`${intersection.x} ${intersection.y} ${intersection.z}`
			);
			this.rayCatcher.object3D.lookAt(
				this.camera.object3D.localToWorld(new THREE.Vector3(0, 0, 0))
			);
			this.distance = this.camera.object3D.position.distanceTo(this.rayCatcher.object3D.position);
			this.rayCatcher.setAttribute(
				'scale',
				`${this.distance / 5} ${this.distance / 5} ${this.distance / 5} `
			);
			this.rig.setAttribute('look-controls', 'enabled:false');
			this.state = 'moving';
		});
		//attach shift key to move object up and down

		window.addEventListener('wheel', (evt) => {
			if (this.state != 'moving') return;
			if (evt.deltaY < 0) {
				this.rayCatcher.object3D.translateZ(-0.05 * this.distance);
			} else {
				this.rayCatcher.object3D.translateZ(0.05 * this.distance);
			}
		});
		this.el.addEventListener('mouseup', () => {
			if (!this.rig) return;
			this.rayCatcher.setAttribute('position', '0 -100 0');
			this.rig.setAttribute('look-controls', 'enabled:true');
			this.state = 'idle';
			this.initialPos = null;
		});
	},
	tick: function (e) {
		if (this.state === 'moving') {
			var intersections = this.cursorEl.components.raycaster.intersections;
			if (intersections.length > 0) {
				const intersection = intersections.find(
					(intersection: any) => intersection.object.el.id == 'rayCatcher'
				)?.point;
				if (!intersection) return;
				//convert intersection to local coordinates
				if (this.initialPos) {
					const diff = {
						x: intersection.x - this.initialPos.x,
						y: intersection.y - this.initialPos.y,
						z: intersection.z - this.initialPos.z
					};
					//if diff is too small, don't do anything
					if (Math.abs(diff.x) == 0 && Math.abs(diff.y) == 0 && Math.abs(diff.z) == 0) return;
					if (editableObject.transportMode == 'position') {
						this.el.setAttribute(
							'position',
							`${this.el.getAttribute('position').x + diff.x}
							${this.el.getAttribute('position').y + diff.y}
							${this.el.getAttribute('position').z + diff.z}`
						);
					} else if (editableObject.transportMode == 'rotation') {
						const factor = diff.x * 20;
						this.el.setAttribute(
							'rotation',
							`${this.el.getAttribute('rotation').x - (diff.y * 200) / this.distance} ${
								this.el.getAttribute('rotation').y + (diff.x * 200) / this.distance
							} 0`
						);
						const result = this.el.getAttribute('rotation').y;
					} else if (editableObject.transportMode == 'scale') {
						this.el.setAttribute(
							'scale',
							`${this.el.getAttribute('scale').x + diff.x / this.distance}
							${this.el.getAttribute('scale').y + diff.x / this.distance}
							${this.el.getAttribute('scale').z + diff.x / this.distance}`
						);
					}

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
				this.initialPos = { ...intersection };
			}
		}
	}
});
