import type { Me } from '$lib/frontend/Classes/Me';
import type { SharedObject } from '$lib/frontend/Classes/SharedObject';
import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
import { User } from '$lib/frontend/Classes/User';
import { Users } from '$lib/frontend/Classes/Users';
import { videoChat } from '$lib/frontend/Classes/VideoChat';
import { _ } from '$lib/i18n';
import { FocusObjectStore, UserStore, type xyz } from '$lib/store';
import type { Entity } from 'aframe';
import axios from 'axios';
let me: Me;
UserStore.subscribe((val) => {
	me = Users.find(val?.id) as Me;
});

AFRAME.registerComponent('editable-object', {
	state: 'idle',
	initialPos: null as xyz | null,
	cursorEl: null as Entity | null,
	rayCatcher: null as Entity | null,
	readyToLink: false,
	object: null as SharedObject | null,
	camera: null as Entity | null,
	distance: 0,
	timeout: null as any,
	init: function () {
		this.cursorEl = document.querySelector('[raycaster]');
		this.rayCatcher = document.getElementById('rayCatcher') as Entity;
		this.object = sharedObjects.get(this.el.id) || null;

		this.el.addEventListener('mousedown', (e: any) => {
			if (!this.object || !this.rayCatcher) return console.error('object is null');
			this.object.focus();
			this.camera = document.getElementById('camera') as Entity;
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
			me.pauseControls();

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
			if (!this.object || !this.object.focused) return;
			if (this.object.locked) {
				if (this.object.linkTo && this.object.shortType == 'image') {
					if (this.object.readyToLink) {
						this.object.openLink();
					} else {
						this.object.getReadyToLink();
					}
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
			me.resumeControls();
			this.state = 'idle';
			this.initialPos = null;
			//lets' save position
			this.object.updateComponents();
		});
		window.addEventListener('keydown', (evt) => {
			if (!this.object) return;
			if (evt.key == 'Shift') {
				//rotation
				this.object.transportMode = 'rotation';
			} else if (evt.key == 'Control') {
				//scale
				this.object.transportMode = 'scale';
			} else if (evt.key == 'Escape') {
				//scale
				this.deselect();
			}
		});
		window.addEventListener('keyup', (evt) => {
			if (!this.object) return;

			if (evt.key == 'Shift') {
				//rotation
				this.object.transportMode = 'position';
			} else if (evt.key == 'Control') {
				//scale
				this.object.transportMode = 'position';
			}
		});
	},
	deselect: function () {
		if (!this.rayCatcher) return console.error('raycatcher is null');

		this.rayCatcher.setAttribute('position', '0 -100 0');
		me.resumeControls();
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
					if (this.object.transportMode == 'position') {
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
					} else if (this.object.transportMode == 'rotation') {
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
					} else if (this.object.transportMode == 'scale') {
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
