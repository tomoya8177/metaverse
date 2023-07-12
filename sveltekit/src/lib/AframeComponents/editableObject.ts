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
			const distance = this.camera.object3D.position.distanceTo(this.rayCatcher.object3D.position);
			this.rayCatcher.setAttribute('scale', `${distance / 5} ${distance / 5} ${distance / 5} `);
			this.rig.setAttribute('look-controls', 'enabled:false');
			this.state = 'moving';
		});
		window.addEventListener('wheel', (evt) => {
			if (this.state != 'moving') return;
			if (evt.deltaY < 0) {
				this.rayCatcher.object3D.translateZ(-0.5);
			} else {
				this.rayCatcher.object3D.translateZ(0.5);
			}
		});
		this.el.addEventListener('mouseup', () => {
			if (!this.rig) return;
			this.rayCatcher.setAttribute('position', '0 -100 0');
			this.rig.setAttribute('look-controls', 'enabled:true');
			this.state = 'idle';
			this.initialPos = null;
			editableObject.openMenu();
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
				if (this.initialPos) {
					const diff = {
						x: intersection.x - this.initialPos.x,
						y: intersection.y - this.initialPos.y,
						z: intersection.z - this.initialPos.z
					};
					//if diff is too small, don't do anything
					if (Math.abs(diff.x) == 0 && Math.abs(diff.y) == 0 && Math.abs(diff.z) == 0) return;
					this.el.setAttribute(
						'position',
						`${this.el.getAttribute('position').x + diff.x}
            ${this.el.getAttribute('position').y + diff.y}
            ${this.el.getAttribute('position').z + diff.z}`
					);
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
