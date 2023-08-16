import { wasdControl } from '$lib/frontend/Classes/WASDControl';

AFRAME.registerComponent('my-wasd-controls', {
	/**
	 * Touch-to-move-forward controls for mobile.
	 */
	schema: {
		enabled: { default: true },
		reverseEnabled: { default: true },
		speed: { default: 0.0015 }
	},
	init: function () {
		console.log('wasd initialized');
		//on key down
		setInterval(() => {
			if (!this.data.enabled) return;
			if (Math.abs(wasdControl.velocityX) < 1 && Math.abs(wasdControl.velocityZ) < 1) return;

			const vector = new THREE.Vector3(wasdControl.velocityX * -1, 0, wasdControl.velocityZ * -1);
			vector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.el.object3D.rotation.y);
			this.el.object3D.position.x += this.data.speed * vector.x;
			this.el.object3D.position.z += this.data.speed * vector.z;
		}, 30);
	}
});
