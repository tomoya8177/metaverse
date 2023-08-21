import axios from 'axios';
import { Unit } from './Unit';
import { connect, createLocalTracks } from 'twilio-video';
import type { Room } from './Room';
import type { Component, Entity, ObjectMap, System } from 'aframe';
import { User } from './User';
import { CoinHistory } from './CoinHistory';
import { videoChat } from './VideoChat';
import { degree2radian } from '$lib/math/degree2radians';

export class Me extends Unit {
	cameraRig: Entity;
	constructor(user: User, roomId?: string) {
		super(user);
		this.el.setAttribute('update-position', '');
		this.el.setAttribute('look-controls', '');
		//this.el.setAttribute('my-wasd-controls', 'enabled:true');
		// this.el.setAttribute('my-touch-controls2', 'enabled:false');
		const camera = document.createElement('a-camera');
		camera.setAttribute('id', 'camera');
		camera.setAttribute('look-controls-enabled', 'false');
		camera.setAttribute('wasd-controls-enabled', 'false');
		camera.setAttribute('position', '0 0.2 0.5');
		camera.setAttribute('rotation', '-15 0 0');
		this.cameraRig = document.createElement('a-entity');
		this.cameraRig.setAttribute('position', '0 1.6 0');
		this.avatarContainer.appendChild(this.cameraRig);
		this.cameraRig.appendChild(camera);
		//get window width

		const circle = document.createElement('a-circle');
		circle.setAttribute('radius', '0.03');
		circle.setAttribute('color', 'white');
		circle.setAttribute('position', `0 -0.1 -0.3`);
		circle.setAttribute('opacity', '0.5');
		circle.setAttribute('material', 'shader:flat;src:url(/images/upicon.jpg)');
		//circle.setAttribute('text', 'value:^;color:white;align:center;');
		circle.setAttribute('jump-button', 'userId:' + this.id + ';');
		circle.id = 'jumpButton';
		camera.appendChild(circle);

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
}
