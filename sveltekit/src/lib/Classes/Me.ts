import axios from 'axios';
import { Unit } from './Unit';
import { connect, createLocalTracks } from 'twilio-video';

export class Me extends Unit {
	cameraRig: Entity;
	constructor(userId: string) {
		super(userId);
		this.el.setAttribute('movement-controls', 'constrainToNavMesh: true;camera: #camera;');
		this.el.setAttribute('touch-controls', '');
		this.el.setAttribute('gamepad-controls', '');
		//this.el.setAttribute('wasd-controls', '');
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

		//enter twiklio room
	}
}
