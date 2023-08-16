AFRAME.registerComponent('jump', {
	schema: {
		acceleration: { default: 0 }
	},
	tick: function () {
		if (this.data.acceleration == 0) return;
		//rotate vecotor by it's x rotation
		//apply rotation by axis
		const axis = new THREE.Vector3(1, 0, 0);
		const vector = new THREE.Vector3(0, this.data.acceleration, 0).applyAxisAngle(
			axis,
			this.el.object3D.rotation.x
		);
		const zAccell = vector.z;
		const yAccell = vector.y;
		this.el.object3D.position.y += yAccell;
		this.el.object3D.position.z += zAccell;
		if (this.el.object3D.position.y < 0) {
			this.data.acceleration = 0;
			this.el.object3D.position.y = 0;
			this.el.object3D.position.z = 0;
		} else {
			this.data.acceleration -= 0.004;
		}
	}
});
