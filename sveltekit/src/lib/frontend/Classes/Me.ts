import axios from 'axios';
import { Unit } from './Unit';
import { connect, createLocalTracks } from 'twilio-video';
import type { Room } from './Room';
import type { Component, Entity, ObjectMap, System } from 'aframe';
import type { User } from './User';

export class Me extends Unit {
	cameraRig: Entity;
	constructor(user: User) {
		super(user);
		this.el.setAttribute('update-position', '');
		this.el.setAttribute('look-controls', '');
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
}
