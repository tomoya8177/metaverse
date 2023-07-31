import { degree2radian } from '$lib/math/degree2radians';
AFRAME.registerComponent('hand-position', {
	init: function () {
		this.el.addEventListener('model-loaded', () => {
			const model = this.el.object3D;
			model.traverse((node: any) => {
				if (node.name === 'RightHand') {
					node.rotation.y = degree2radian(80);
					node.position.y -= 0.3;
					node.position.x += 0.4;
				}
				if (node.name === 'LeftHand') {
					node.rotation.y = degree2radian(-80);
					node.position.y -= 0.3;
					node.position.x -= 0.4;
				}
			}, true);
		});
	}
});
