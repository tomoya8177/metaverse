import axios from 'axios';
import { Unit } from './Unit';
import { connect, createLocalTracks } from 'twilio-video';
import type { Room } from './Room';
import type { Component, Entity, ObjectMap, System } from 'aframe';
import { User } from './User';
import { CoinHistory } from './CoinHistory';
import { videoChat } from './VideoChat';
import { degree2radian } from 'mymetaverse-helper';

import { flip } from 'svelte/animate';

export class Me extends Unit {
	cameraRig: Entity;
	selfie: Entity | null = null;
	camera: Entity;
	constructor(user: User, roomId?: string) {
		super(user);
		this.el.setAttribute('update-position', '');
		this.el.setAttribute('look-controls', '');
		//this.el.setAttribute('my-wasd-controls', 'enabled:true');
		// this.el.setAttribute('my-touch-controls2', 'enabled:false');
		this.camera = document.createElement('a-camera');
		this.camera.setAttribute('id', 'camera');
		this.camera.setAttribute('look-controls-enabled', 'false');
		this.camera.setAttribute('wasd-controls-enabled', 'false');
		this.camera.setAttribute('position', '0 0.2 0.6');
		this.camera.setAttribute('rotation', '-15 0 0');
		this.cameraRig = document.createElement('a-entity');
		this.cameraRig.setAttribute('position', '0 1.6 0');
		this.avatarContainer.appendChild(this.cameraRig);
		this.cameraRig.appendChild(this.camera);

		const selfieCamera = document.createElement('a-camera');
		selfieCamera.setAttribute('id', 'selfieCamera');
		selfieCamera.setAttribute('active', 'false');
		selfieCamera.setAttribute('position', '0 -0.1 -1.2');
		selfieCamera.setAttribute('look-controls-enabled', 'false');
		selfieCamera.setAttribute('wasd-controls-enabled', 'false');
		selfieCamera.setAttribute('rotation', '0 180 0');
		this.camera.appendChild(selfieCamera);

		const circle = document.createElement('a-circle');
		circle.setAttribute('radius', '0.03');
		circle.setAttribute('color', 'white');
		circle.setAttribute('position', `0.06 -0.1 -0.3`);
		circle.setAttribute('opacity', '0.5');
		circle.setAttribute('material', 'shader:flat;src:url(/images/upicon.jpg)');
		//circle.setAttribute('text', 'value:^;color:white;align:center;');
		circle.setAttribute('jump-button', 'userId:' + this.id + ';');
		circle.id = 'jumpButton';
		this.camera.appendChild(circle);

		this.el.setAttribute(
			'movement-controls',
			'constrainToNavMesh: true; camera: #camera; controls: keyboard,my-touch2'
		);
		//this.el.setAttribute('ping-session', `user:${user.id};type:unit`);
		console.log(roomId, user, user.lastRoom, user.lastPosition);
		if (roomId && user.lastRoom == roomId) {
			this.setLastPosition(user);
		}
	}
	updateAvatar() {
		console.log('updating avatar');
		this.avatar?.setAttribute('src', this.avatarURLWithParams);
	}
	showSelfie() {
		this.selfie = document.createElement('a-entity');
		this.selfie.setAttribute('position', '0.55 0 -1.2');
		this.selfie.setAttribute('geometry', 'primitive:plane;width:0.54;height:0.74');
		this.selfie.setAttribute('material', 'shader:flat;color:#333;');
		this.selfie.setAttribute('rotation', '0 -10 0');
		this.camera.appendChild(this.selfie);
		const captureButton = document.createElement('a-entity');
		captureButton.setAttribute('id', 'captureButton');
		captureButton.setAttribute('position', '0.15 -0.25 0.01');
		captureButton.setAttribute('geometry', 'primitive:circle;radius:0.06');
		captureButton.setAttribute('material', 'shader:flat;color:red;');
		captureButton.setAttribute('text', 'value:Capture;align:center');
		this.selfie.appendChild(captureButton);
		const flipButton = document.createElement('a-entity');
		flipButton.setAttribute('id', 'flipButton');
		flipButton.setAttribute('position', '0 -0.25 0.01');
		flipButton.setAttribute('geometry', 'primitive:circle;radius:0.06');
		flipButton.setAttribute('material', 'shader:flat;color:blue;');
		flipButton.setAttribute('text', 'value:Flip;align:center');
		this.selfie.appendChild(flipButton);
		const selfieCameraPreview = document.createElement('a-plane');
		selfieCameraPreview.setAttribute('id', 'selfieCameraPreview');
		selfieCameraPreview.setAttribute('position', '0 0.1 0.01');
		selfieCameraPreview.setAttribute('rotation', '0 180 0');
		selfieCameraPreview.setAttribute('width', '0.5');
		selfieCameraPreview.setAttribute('height', '0.5');
		selfieCameraPreview.setAttribute('canvas-updater', '');
		selfieCameraPreview.setAttribute(
			'material',
			`
			side:double;
		shader:flat;
		src:#selfieCanvas
		`
		);
		this.selfie.appendChild(selfieCameraPreview);
	}
	hideSelfie() {
		this.selfie?.parentNode?.removeChild(this.selfie);
	}
	async savePosition(roomId: string): Promise<void> {
		await axios.put('/api/users/' + this.id, {
			lastRoom: roomId,
			lastPosition: JSON.stringify({
				position: this.position,
				rotation: this.rotation
			})
		});
	}
	setLastPosition(user: User) {
		let data;
		if (user.lastPosition) data = JSON.parse(user.lastPosition);
		else
			data = {
				position: {
					x: 0,
					y: 0,
					z: 0
				},
				rotation: {
					x: 0,
					y: 0,
					z: 0
				}
			};
		console.log('setting last position', data);
		this.el.setAttribute('position', data.position);
		this.el.object3D.rotation.y = degree2radian(data.rotation.y);
	}
	enableTouch(): void {
		this.el.setAttribute('my-touch2-controls', 'enabled: true');
	}
	disableTouch(): void {
		this.el.setAttribute('my-touch2-controls', 'enabled: false');
	}
	jump(): void {
		let acceleration = 0.1;
		this.avatarContainer.setAttribute('jump', 'acceleration:' + acceleration + ';');
		videoChat.sendMessage({
			key: 'jump',
			userId: this.id
		});
	}
	async sendLike(userId: string, action: string, coins: number) {
		const coinHistory = await new CoinHistory({
			user: userId,
			action,
			source: this.id,
			coins
		}).create();
		let user = await axios.get('/api/users/' + userId).then((res) => res.data);
		if (!user) return;
		user = new User(user);
		user.coin += coins;
		user.update();
	}
	pauseControls() {
		this.el.setAttribute('look-controls', 'enabled:false');
		this.el.setAttribute('touch-controls', 'enabled:false');
	}
	resumeControls() {
		this.el.setAttribute('look-controls', 'enabled:true');
		this.el.setAttribute('touch-controls', 'enabled:true');
	}
}
