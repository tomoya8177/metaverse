AFRAME.registerComponent('resize-onload', {
	init: function () {
		this.el.addEventListener('materialtextureloaded', () => {
			console.log('materialtextureloaded');
			//get aspect ratio
			const material = this.el.getAttribute('material');
			console.log({ material });
			const width = material.width;
			const height = material.height;
			const aspectRatio = width / height;
			//set attribute height based on the aspect ratio
			console.log({ aspectRatio });
			this.el.setAttribute(
				'geometry',
				'height',
				this.el.getAttribute('geometry').width * aspectRatio
			);
		});
	}
});
