import axios from 'axios';
import { Unit } from './Unit';
import { connect, createLocalTracks } from 'twilio-video';
import type { Event } from './Event';
import type { Component, Entity, ObjectMap, System } from 'aframe';

export class Me extends Unit {
	cameraRig: Entity;
	constructor(userId: string) {
		super(userId);
		this.el.setAttribute('look-controls', '');
		this.el.setAttribute('update-position', '');
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
			'constrainToNavMesh: true; camera: #camera; controls: keyboard,touch'
		);

		this.el.setAttribute('ping-session', `user:${userId};type:unit`);
	}
	async setLastPosition(event: Event): Promise<void> {
		const sessions = await axios
			.get(`/api/sessions?user=${this.userId}&event=${event.id}&type=unit`)
			.then((res) => res.data.sort((a, b) => (a.startAt < b.startAt ? 1 : -1)));
		console.log({ sessions });

		if (!sessions || !sessions.length) return;
		const parsedComponents = JSON.parse(sessions[0].components);
		if (!parsedComponents || !parsedComponents.position) return;
		console.log({ parsedComponents });
		this.position = parsedComponents.position;
		this.rotation = parsedComponents.rotation;
	}
}
