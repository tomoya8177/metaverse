import { nippleControl } from '$lib/frontend/Classes/NippleControl';
AFRAME.registerComponent('my-nipple-control', {
	schema: {
		userId: { type: 'string' }
	},
	init: function () {
		this.rig = document.getElementById(this.data.userId);
		this.dVelocity = new THREE.Vector3();
	},
	getVelocityDelta: function () {
		console.log('getVelocityDelta');
		this.dVelocity.z = -1;
		return this.dVelocity.clone();
	},
	tick: function () {
		if (nippleControl.status != 'dragging') {
			//do something later
		} else {
			const distance = nippleControl.distance;
			const angle = nippleControl.angle;
			//set velocity for movement controls
			this.rig.components['movement-controls'].velocity.z = distance;
			console.log({ distance, angle });
		}
	}
});
