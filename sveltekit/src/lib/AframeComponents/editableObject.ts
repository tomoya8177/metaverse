import { editableObject } from '$lib/frontend/Classes/EditableObject';
import { videoChat } from '$lib/frontend/Classes/VideoChat';
import { degree2radian } from '$lib/math/degree2radians';
import { FocusObjectStore, UserStore, type xyz } from '$lib/store';
import 'aframe';
import axios from 'axios';
import { get } from 'svelte/store';
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
			//lets' save position
			axios.put('/api/objects/' + this.el.id, {
				components: JSON.stringify({
					position: this.el.getAttribute('position'),
					rotation: this.el.getAttribute('rotation'),
					scale: this.el.getAttribute('scale')
				})
			});
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
						//the diff shoukld be calculated with pointsrelative to the raycatcher
						const relativeDiff = this.getRelativeDiff(intersection);
						const factor = relativeDiff.x * 20;
						this.el.setAttribute(
							'rotation',
							`${this.el.getAttribute('rotation').x - (relativeDiff.y * 200) / this.distance} ${
								this.el.getAttribute('rotation').y + (relativeDiff.x * 200) / this.distance
							} 0`
						);
						const result = this.el.getAttribute('rotation').y;
					} else if (editableObject.transportMode == 'scale') {
						const relativeDiff = this.getRelativeDiff(intersection);
						this.el.setAttribute(
							'scale',
							`${this.el.getAttribute('scale').x + relativeDiff.x / this.distance}
							${this.el.getAttribute('scale').y + relativeDiff.x / this.distance}
							${this.el.getAttribute('scale').z + relativeDiff.x / this.distance}`
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
	},
	getRelativeDiff: function (intersection: xyz) {
		//turn it to Vector 3
		const intersectionVector = new THREE.Vector3(intersection.x, intersection.y, intersection.z);
		//convert it to rayCatcher local
		intersectionVector.applyMatrix4(this.rayCatcher.object3D.matrixWorld);
		//rotate intersection vector to raycatcher's rotation
		const initialPosVector = new THREE.Vector3(
			this.initialPos.x,
			this.initialPos.y,
			this.initialPos.z
		);
		//convert it to rayCatcher local
		initialPosVector.applyMatrix4(this.rayCatcher.object3D.matrixWorld);

		//get the intersection on raycatcher's plane

		const relativeIntersection = intersectionVector.sub(this.rayCatcher.object3D.position);
		const relativeInitialPos = initialPosVector.sub(this.rayCatcher.object3D.position);
		const relativeDiff = {
			x: relativeIntersection.x - relativeInitialPos.x,
			y: relativeIntersection.y - relativeInitialPos.y,
			z: relativeIntersection.z - relativeInitialPos.z
		};
		return relativeDiff;
	}
});
