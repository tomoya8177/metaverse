import axios from 'axios';
import { Unit } from './Unit';
import { connect, createLocalTracks } from 'twilio-video';
import type { Room } from './Room';
import type { Component, Entity, ObjectMap, System } from 'aframe';
import { User } from './User';
import { CoinHistory } from './CoinHistory';
import { videoChat } from './VideoChat';

export class Me extends Unit {
	cameraRig: Entity;
	constructor(user: User) {
		super(user);
		this.el.setAttribute('update-position', '');
		this.el.setAttribute('look-controls', '');
		//this.el.setAttribute('my-wasd-controls', 'enabled:true');
		this.el.setAttribute('my-touch-controls', 'enabled:false');
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
		circle.setAttribute('text', 'value:Jump;color:white;align:center;width:0.5');
		circle.setAttribute('jump-button', 'userId:' + this.id + ';');
		circle.id = 'jumpButton';
		camera.appendChild(circle);

		this.el.setAttribute(
			'movement-controls',
			'constrainToNavMesh: true; camera: #camera; controls: keyboard'
		);

		this.el.setAttribute('ping-session', `user:${user.id};type:unit`);
	}
	async setLastPosition(room: Room): Promise<void> {
		const sessions = await axios
			.get(`/api/sessions?user=${this.userId}&room=${room.id}&type=unit`)
			.then((res) => res.data.sort((a, b) => (a.startAt < b.startAt ? 1 : -1)));
		console.log({ sessions });

		if (!sessions || !sessions.length) return;
		const parsedComponents = JSON.parse(sessions[0].components);
		if (!parsedComponents || !parsedComponents.position) return;
		console.log({ parsedComponents });
		this.position = parsedComponents.position;
		this.rotation = parsedComponents.rotation;
	}
	enableTouch(): void {
		this.el.setAttribute('my-touch-controls', 'enabled: true');
	}
	disableTouch(): void {
		this.el.setAttribute('my-touch-controls', 'enabled: false');
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
