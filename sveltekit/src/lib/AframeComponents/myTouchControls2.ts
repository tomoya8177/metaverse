import { nippleControl } from '$lib/frontend/Classes/NippleControl';
import type { Entity } from 'aframe';
import type { Scene, Vector3 } from 'three';

/**
 * Touch-to-move-forward controls for mobile.
 */
AFRAME.registerComponent('my-touch2-controls', {
	dVelocity: new THREE.Vector3() as Vector3,
	direction: 0,
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
		const sceneEl = this.el.sceneEl as any;
		const canvasEl = sceneEl.canvas;

		if (!canvasEl) {
			sceneEl.addEventListener('render-target-loaded', this.addEventListeners.bind(this));
			return;
		}

		canvasEl.addEventListener('touchstart', this.onTouchStart);
		canvasEl.addEventListener('touchend', this.onTouchEnd);
		const vrModeUI = sceneEl.getAttribute('vr-mode-ui');
		if (vrModeUI && vrModeUI.cardboardModeEnabled) {
			sceneEl.addEventListener('enter-vr', this.onEnterVR);
		}
	},

	removeEventListeners: function () {
		const canvasEl = this.el.sceneEl && this.el.sceneEl.canvas;
		if (!canvasEl) {
			return;
		}

		canvasEl.removeEventListener('touchstart', this.onTouchStart);
		canvasEl.removeEventListener('touchend', this.onTouchEnd);
		this.el.sceneEl?.removeEventListener('enter-vr', this.onEnterVR);
	},

	isVelocityActive: function () {
		//return this.data.enabled && !!this.direction;
		return nippleControl.status == 'dragging';
	},

	getVelocityDelta: function () {
		this.dVelocity.z = this.direction;
		//return this.dVelocity.clone();
		const vector = new THREE.Vector3(nippleControl.distanceX / 30, 0, nippleControl.distanceY / 30);
		return vector;
	},

	bindMethods: function () {
		this.onTouchStart = this.onTouchStart.bind(this);
		this.onTouchEnd = this.onTouchEnd.bind(this);
		this.onEnterVR = this.onEnterVR.bind(this);
	},

	onTouchStart: function (e) {
		this.direction = -1;
		if (this.data.reverseEnabled && e.touches && e.touches.length === 2) {
			this.direction = 1;
		}
		e.preventDefault();
	},

	onTouchEnd: function (e) {
		this.direction = 0;
		e.preventDefault();
	},

	onEnterVR: function () {
		// This is to make the Cardboard button on Chrome Android working
		const xrSession = this.el.sceneEl?.xrSession;
		if (!xrSession) {
			return;
		}
		xrSession.addEventListener('selectstart', this.onTouchStart);
		xrSession.addEventListener('selectend', this.onTouchEnd);
	}
});
