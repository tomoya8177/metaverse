import { nippleControl } from '$lib/frontend/Classes/NippleControl';
import { tick } from 'svelte';

/**
 * Touch-to-move-forward controls for mobile.
 */
AFRAME.registerComponent('my-touch-controls', {
	schema: {
		enabled: { default: true },
		reverseEnabled: { default: true }
	},

	init: function () {
		this.dVelocity = new THREE.Vector3();
		this.bindMethods();
		this.direction = 0;
	},

	play: function () {
		console.log('playing myTouchControls');
		this.addEventListeners();
	},

	pause: function () {
		this.removeEventListeners();
		this.dVelocity.set(0, 0, 0);
	},

	remove: function () {
		this.pause();
	},

	addEventListeners: function () {
		const sceneEl = this.el.sceneEl;
		const canvasEl = scene.canvas;

		//document.querySelector('.innerButton').addEventListener('touchstart', this.onTouchStart);
		// document.getElementById('navUp').addEventListener('mouseenter', this.onTouchStart);
		// document.getElementById('navDown').addEventListener('touchstart', this.onTouchStartBack);
		// document.getElementById('navDown').addEventListener('mouseenter', this.onTouchStartBack);
		// document.getElementById('navUp').addEventListener('touchend', this.onTouchEnd);
		// document.getElementById('navUp').addEventListener('mouseleave', this.onTouchEnd);
		// document.getElementById('navDown').addEventListener('touchend', this.onTouchEnd);
		// document.getElementById('navDown').addEventListener('mouseleave', this.onTouchEnd);
		// if (!canvasEl) {
		// 	scene.addEventListener('render-target-loaded', this.addEventListeners.bind(this));
		// 	return;
		// }
		//canvasEl.addEventListener('touchstart', this.onTouchStart);
		//    canvasEl.addEventListener('touchend', this.onTouchEnd);
	},

	removeEventListeners: function () {
		const canvasEl = this.el.sceneEl && this.el.scene.canvas;
		if (!canvasEl) {
			return;
		}

		canvasEl.removeEventListener('touchstart', this.onTouchStart);
		canvasEl.removeEventListener('touchend', this.onTouchEnd);
	},

	isVelocityActive: function () {
		return this.data.enabled && !!this.direction;
	},

	getVelocityDelta: function () {
		console.log('getVelocityDelta');
		// this.dVelocity.z = this.direction;
		// return this.dVelocity.clone();
		//	return nippleControl.direction;
		console.log({
			direction: nippleControl.direction, //this is radians
			distance: nippleControl.distance
		});
		//get velocity delta based on direction and distance
		const velocity = new THREE.Vector3();
		velocity.z = Math.cos(nippleControl.direction) * nippleControl.distance;
		velocity.x = Math.sin(nippleControl.direction) * nippleControl.distance;
		return velocity;
	},

	bindMethods: function () {
		this.onTouchStartBack = this.onTouchStartBack.bind(this);
		this.onTouchStart = this.onTouchStart.bind(this);
		this.onTouchEnd = this.onTouchEnd.bind(this);
	},

	onTouchStart: function (e) {
		console.log('touchstart', e);
		e.preventDefault();
		this.direction = -1;
		/*
    if (this.data.reverseEnabled && e.touches.length === 2) {
      this.direction = 1;
    }
    */
	},
	onTouchStartBack: function (e) {
		e.preventDefault();

		this.direction = 1;
	},

	onTouchEnd: function (e) {
		e.preventDefault();
		this.direction = 0;
	},
	tick: function () {
		if (!this.data.enabled) return;
		if (Math.abs(nippleControl.distanceX) < 1 && Math.abs(nippleControl.distanceY) < 1) return;
		//const velocity = this.getVelocityDelta();
		const vector = new THREE.Vector3(nippleControl.distanceX, 0, nippleControl.distanceY);
		vector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.el.object3D.rotation.y);
		this.el.object3D.position.x += vector.x / 1000;
		this.el.object3D.position.z += vector.z / 1000;
	}
});
