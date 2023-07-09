import 'aframe';
AFRAME.registerComponent('click-to-move-screen', {
	schema: {
		direction: { type: 'string', default: 'up' }
	},
	init: function () {
		this.video = this.el.parentNode.parentNode.parentNode;
		this.el.addEventListener('click', () => {
			console.log('clicked', this.data);
			this.video.object3D.position.y += this.data.direction == 'up' ? 0.3 : -0.3;
		});
	}
});
AFRAME.registerComponent('click-to-resize-screen', {
	schema: {
		direction: { type: 'string', default: 'up' }
	},
	init: function () {
		this.video = this.el.parentNode.parentNode;
		this.el.addEventListener('click', () => {
			console.log('clicked', this.data);
			this.video.object3D.scale.y =
				this.video.object3D.scale.y * (this.data.direction == 'up' ? 1.4 : 0.6);
			this.video.object3D.scale.x =
				this.video.object3D.scale.x * (this.data.direction == 'up' ? 1.4 : 0.6);
		});
	}
});
