import 'aframe';
AFRAME.registerComponent('rotate-at-position', {
	init: function () {
		this.parent = this.el.parentNode;
		this.neck = null;
		this.cameraRig = null;
	},
	tick: function () {
		if (!this.parent) return;
		const parentRotation = this.parent.object3D.rotation.x;
		if (!this.neck) {
			const model = this.el.querySelector('a-gltf-model')?.object3D;
			if (!model) return;
			model.traverse((node) => {
				if (node.name == 'Neck') {
					console.log('neck found', node);
					this.neck = node;
				}
			}, true);
		} else {
			this.neck.rotation.x = -parentRotation;
		}
		if (!this.cameraRig) {
			this.cameraRig = this.el.querySelector('a-entity');
		} else {
			this.cameraRig.object3D.rotation.x = parentRotation;
		}
		this.el.object3D.rotation.x = -parentRotation;
	}
});
