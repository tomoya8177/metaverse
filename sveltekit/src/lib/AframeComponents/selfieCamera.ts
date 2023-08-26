import type { Me } from '$lib/frontend/Classes/Me';
import type { Room } from '$lib/frontend/Classes/Room';
import { SharedObject } from '$lib/frontend/Classes/SharedObject';
import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
import { uploader } from '$lib/frontend/Classes/Uploader';
import { Users } from '$lib/frontend/Classes/Users';
import { videoChat } from '$lib/frontend/Classes/VideoChat';
import { RoomStore } from '$lib/store';
import type { Entity, Scene } from 'aframe';
let room: Room;
RoomStore.subscribe((value) => {
	if (!value) return;
	room = value;
});

AFRAME.registerComponent('selfie-camera', {
	ctx: null as any,
	sceneEl: null as null | Scene,
	selfieCam: null as null | THREE.Camera,
	flipButton: null as null | Entity,
	captureButton: null as null | Entity,
	camera: null as null | Entity,
	width: 1024,
	height: 1024,
	schema: {
		enabled: { type: 'boolean', default: true }
	},
	remove: function () {
		console.log('removing selfie camera');
		this.flipButton?.removeEventListener('click', this.onFlip);
		this.captureButton?.removeEventListener('click', this.onCapture);
	},
	onFlip: function () {
		const camera = document.querySelector('#selfieCamera');
		const preview = document.querySelector('#selfieCameraPreview');
		console.log(camera, preview);
		if (!preview || !camera) return;
		camera.object3D.rotation.y += Math.PI;
		preview.object3D.rotation.y += Math.PI;
	},
	onCapture: async function () {
		const captureButton = document.querySelector('#captureButton');
		if (!captureButton) return;
		captureButton.setAttribute('text', { value: 'Capturing...' });
		const canvas = document.querySelector('#selfieCanvas');
		const file = await uploader.uploadCanvas(canvas, 'selfie.jpg');
		if (!file) return;
		captureButton.setAttribute('text', { value: 'Uploading...' });
		console.log({ file });
		const sharedObject = new SharedObject({
			url: file.url,
			type: file.type,
			title: 'Selfie',
			handle: file.handle
		});
		await sharedObject.create();
		sharedObject.attachElement();
		sharedObjects.add(sharedObject);
		const player = Users.find(sharedObject.user) as Me;
		await sharedObject.moveToMyFront(player.position, player.rotation);
		captureButton.setAttribute('text', { value: 'Capture' });
		setTimeout(async () => {
			await sharedObject.update();
			videoChat.sendMessage({
				id: sharedObject.id,
				key: 'objectCreate'
			});
		}, 100);
	},
	init: function () {
		// grab the secondary camera (the THREEjs cam within the camera component)
		console.log('selfie camera init');
		this.camera = document.querySelector('#selfieCamera');

		this.selfieCam = this.camera.components.camera.camera;
		let canvas = document.getElementById('selfieCanvas');
		console.log({ canvas });
		if (!canvas) return;
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;
		const aspect = screenHeight / screenWidth;
		this.width = 1024;
		this.height = this.width * aspect;
		canvas.setAttribute('width', this.width.toString());
		canvas.setAttribute('height', this.height.toString());
		const preview = document.querySelector('#selfieCameraPreview');

		if (preview) {
			if (this.width > this.height) {
				//landscape
				preview.setAttribute('height', preview.getAttribute('width') * aspect);
			} else {
				//portrait
				preview.setAttribute('width', preview.getAttribute('height') / aspect);
			}
		}

		if (!canvas) return;
		this.ctx = canvas.getContext('2d');
		this.flipButton = this.el.querySelector('#flipButton');
		if (this.flipButton) {
			this.flipButton.addEventListener('click', this.onFlip);
		}

		this.captureButton = this.el.querySelector('#captureButton');
		if (this.captureButton) {
			this.captureButton.addEventListener('click', this.onCapture);
		}
	},
	tick: function () {
		// wait until init is done
		if (!this.selfieCam || !this.ctx) return;
		// render the secondary camera view
		this.el.renderer.render(this.el.object3D, this.selfieCam);
		// draw the render on the canvas
		this.ctx.drawImage(this.el.renderer.domElement, 0, 0, this.width, this.height);
	}
});
