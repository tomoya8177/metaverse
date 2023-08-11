import type { SharedObject } from '$lib/frontend/Classes/SharedObject';
import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
import { videoChat } from '$lib/frontend/Classes/VideoChat';
import { _ } from '$lib/i18n';
import { EmptyObject } from '$lib/preset/EmptyObject';
import { FocusObjectStore, UserStore, type xyz } from '$lib/store';
import type { Entity, Room } from 'aframe';
import axios from 'axios';
let userId = '';
UserStore.subscribe((user) => {
	userId = user.id;
});

AFRAME.registerComponent('editable-object', {
	state: 'idle',
	initialPos: null as xyz | null,
	cursorEl: null as Entity | null,
	rayCatcher: null as Entity | null,
	transportMode: 'position',
	readyToLink: false,
	object: null as SharedObject | null,
	camera: null as Entity | null,
	rig: null as Entity | null,
	distance: 0,
	timeout: null as any,
	init: function () {
		this.cursorEl = document.querySelector('[raycaster]');
		this.rayCatcher = document.getElementById('rayCatcher') as Entity;

		this.el.addEventListener('mousedown', (e: Room) => {
			this.object = sharedObjects.get(this.el.id) || null;
			if (!this.object || !this.rayCatcher) return console.error('object is null');
			FocusObjectStore.set(this.object);
			this.transportMode = 'position';
			this.camera = document.getElementById('camera') as Entity;
			this.rig = document.getElementById(userId) as Entity;
			if (this.object.locked) {
				return;
			}
			// editableObject.setEntity(this.el);
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
			this.rig.setAttribute('touch-controls', 'enabled:false');
			this.state = 'moving';
		});
		//attach shift key to move object up and down

		window.addEventListener('wheel', (evt) => {
			if (this.state != 'moving' || !this.rayCatcher) return;
			if (evt.deltaY < 0) {
				this.rayCatcher.object3D.translateZ(-0.05 * this.distance);
			} else {
				this.rayCatcher.object3D.translateZ(0.05 * this.distance);
			}
		});
		this.el.addEventListener('mouseup', () => {
			if (this.object && this.object.locked) {
				if (this.object.linkTo) {
					if (this.readyToLink) {
						//link to object
						window.open(this.object.linkTo, '_blank');
						return;
					}
					const text = document.createElement('a-text');
					text.setAttribute('value', _('Click to open'));
					text.setAttribute('position', '0 0 0.02');
					text.setAttribute('color', 'white');
					text.setAttribute('align', 'center');
					text.setAttribute('width', '1');
					//set geometry as background
					const geometry = document.createElement('a-plane');
					geometry.setAttribute('color', 'green');
					geometry.setAttribute('width', '0.4');
					geometry.setAttribute('height', '0.1');
					geometry.setAttribute('position', '0 0 0.01');
					//append to the object
					geometry.classList.add('clickable');
					this.el.appendChild(text);
					this.el.appendChild(geometry);
					setTimeout(() => {
						if (!this.el.lastChild) return;
						this.el.removeChild(this.el.lastChild);
						this.el.removeChild(this.el.lastChild);
						this.readyToLink = false;
					}, 3000);
					this.readyToLink = true;
				}
				clearTimeout(this.timeout);
				this.timeout = setTimeout(() => {
					//deselect object
					let ifEditorOpen;
					FocusObjectStore.update((obj) => {
						if (!obj) return;
						ifEditorOpen = obj.editorOpen;
						return obj;
					});
					if (ifEditorOpen) return;
					this.deselect();
				}, 4000);

				return;
			}
			if (!this.rayCatcher) return console.error('raycatcher is null');
			this.rayCatcher.setAttribute('position', '0 -100 0');
			this.rig?.setAttribute('look-controls', 'enabled:true');
			this.rig?.setAttribute('touch-controls', 'enabled:true');
			this.state = 'idle';
			this.initialPos = null;
			//lets' save position
			axios.put('/api/objects/' + this.el.id, {
				components: JSON.stringify({
					position: this.el.getAttribute('position'),
					rotation: this.el.getAttribute('rotation'),
					scale: this.el.getAttribute('scale'),
					radius: this.el.getAttribute('geometry')?.radius
				})
			});
		});
		window.addEventListener('keydown', (evt) => {
			if (evt.key == 'Shift') {
				//rotation
				this.transportMode = 'rotation';
			} else if (evt.key == 'Control') {
				//scale
				this.transportMode = 'scale';
			} else if (evt.key == 'Escape') {
				//scale
				this.deselect();
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
	},
	deselect: function () {
		if (!this.rayCatcher) return console.error('raycatcher is null');

		this.rayCatcher.setAttribute('position', '0 -100 0');
		this.rig?.setAttribute('look-controls', 'enabled:true');
		this.rig?.setAttribute('touch-controls', 'enabled:true');
		this.state = 'idle';
		this.initialPos = null;
		FocusObjectStore.set(null);
	},
	tick: function (e) {
		if (this.state === 'moving') {
			if (!this.cursorEl) return console.error('raycatcher is null');

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
					if (!this.object) return console.error('object is null');
					if (this.transportMode == 'position') {
						if (this.object?.lockedPosition) {
							this.el.setAttribute(
								'position',
								`${this.el.getAttribute('position').x}
								${this.el.getAttribute('position').y + diff.y}
								${this.el.getAttribute('position').z}`
							);
						} else {
							this.el.setAttribute(
								'position',
								`${this.el.getAttribute('position').x + diff.x}
								${this.el.getAttribute('position').y + diff.y}
								${this.el.getAttribute('position').z + diff.z}`
							);
						}
					} else if (this.transportMode == 'rotation') {
						//the diff shoukld be calculated with pointsrelative to the raycatcher
						const relativeDiff = this.getRelativeDiff(intersection);
						const factor = relativeDiff.x * 40;
						if (this.object.isSphere) {
							this.el.setAttribute(
								'rotation',
								`0 ${this.el.getAttribute('rotation').y + (relativeDiff.x * 300) / this.distance} 0`
							);
						} else {
							this.el.setAttribute(
								'rotation',
								`${this.el.getAttribute('rotation').x - (relativeDiff.y * 300) / this.distance} ${
									this.el.getAttribute('rotation').y + (relativeDiff.x * 300) / this.distance
								} 0`
							);
						}
						const result = this.el.getAttribute('rotation').y;
					} else if (this.transportMode == 'scale') {
						const relativeDiff = this.getRelativeDiff(intersection);
						if (this.object.isSphere) {
							const geometry = this.el.getAttribute('geometry');
							const radius = geometry.radius || 0.5;
							this.el.setAttribute('geometry', {
								radius: `${radius + (relativeDiff.x * 3) / this.distance}`
							});
						} else {
							this.el.setAttribute(
								'scale',
								`${this.el.getAttribute('scale').x + (relativeDiff.x * 3) / this.distance}
								${this.el.getAttribute('scale').y + (relativeDiff.x * 3) / this.distance}
								${this.el.getAttribute('scale').z + (relativeDiff.x * 3) / this.distance}`
							);
						}
					}

					videoChat.sendMessage({
						key: 'objectPosition',
						object: {
							id: this.el.id
						},
						position: this.el.getAttribute('position'),
						rotation: this.el.getAttribute('rotation'),
						scale: this.el.getAttribute('scale'),
						radius: this.el.getAttribute('geometry')?.radius
					});
				}
				this.initialPos = { ...intersection };
			}
		}
	},
	getRelativeDiff: function (intersection: xyz) {
		if (!this.rayCatcher || !this.initialPos)
			return console.error('raycatcher or initialPos is null');
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
