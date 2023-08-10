import { nippleControl } from '$lib/frontend/Classes/NippleControl';
import { tick } from 'svelte';

/**
 * Touch-to-move-forward controls for mobile.
 */
AFRAME.registerComponent('my-touch-controls', {
	schema: {
		enabled: { default: true },
		reverseEnabled: { default: true },
		speed: { default: 1.2 }
	},
	init: function () {
		setInterval(() => {
			if (!this.data.enabled) return;
			if (Math.abs(nippleControl.distanceX) < 1 && Math.abs(nippleControl.distanceY) < 1) return;
			//const velocity = this.getVelocityDelta();
			const vector = new THREE.Vector3(nippleControl.distanceX, 0, nippleControl.distanceY);
			vector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.el.object3D.rotation.y);
			this.el.object3D.position.x += (this.data.speed * vector.x) / 1000;
			this.el.object3D.position.z += (this.data.speed * vector.z) / 1000;
		}, 30);
	},
	tick: function () {}
});
