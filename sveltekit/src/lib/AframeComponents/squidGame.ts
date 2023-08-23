import { DynamicDialog } from '$lib/frontend/Classes/DynamicDialog';
import { SharedObject } from '$lib/frontend/Classes/SharedObject';
import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
import type { Unit } from '$lib/frontend/Classes/Unit';
import { Users } from '$lib/frontend/Classes/Users';
import { myConfirm, toast } from '$lib/frontend/toast';
import { _ } from '$lib/i18n';
import type { xyz } from '$lib/store';
import type { Entity } from 'aframe';
import axios from 'axios';
import { DateTime } from 'luxon';
import { Scene } from 'three';
AFRAME.registerComponent('squid-game', {
	seconds: 0,
	status: 'idle' as 'idle' | 'playing' | 'finished' | 'gameover',
	player: null as null | Unit,
	playerPosition: { x: 0, y: 0, z: 0 } as xyz,
	playerOldPosition: { x: 0, y: 0, z: 0 } as xyz,
	playerMoving: false,
	gunshot: null as null | Entity,
	audio: null as null | Entity,
	timer: null as null | Entity,
	lightStatus: 'red' as 'red' | 'green',
	timeToNextGame: 10,
	gameOverDialog: null as null | DynamicDialog,
	finishedDialog: null as null | DynamicDialog,
	timeLimit: 90,
	timeUp: 5,
	redAnimStarted: false,
	greenAnimStarted: false,

	init: async function () {
		this.gameOverDialog = new DynamicDialog({
			closeButton: true,
			cancelButton: {
				label: _('No')
			},
			header: {
				title: _('Game over')
			},
			body: _('Do you want to play again?'),
			buttons: [
				{
					label: _('Yes'),
					onClick: (evt) => {
						this.reset();
					}
				}
			]
		});
		this.finishedDialog = new DynamicDialog({
			closeButton: true,
			cancelButton: {
				label: _('No')
			},
			header: {
				title: _('You won!')
			},
			body: _('Do you want to play again?'),
			buttons: [
				{
					label: _('Yes'),
					onClick: (evt) => {
						this.reset();
					}
				}
			]
		});
		const scene = document.querySelector('a-scene');
		this.player = Users.find(this.data.userId) as Unit;
		this.player.el.setAttribute('movement-controls', 'speed:0.2');
		const girl = document.createElement('a-gltf-model');
		girl.setAttribute('src', 'url(/models/squid_game_doll/scene.gltf)');
		girl.setAttribute('position', '0 0 -60');
		girl.setAttribute('scale', '0.25 0.25 0.25');

		scene.appendChild(girl);

		this.timer = document.createElement('a-text');
		this.timer.setAttribute('align', 'center');
		this.timer.setAttribute('color', 'white');
		const screenWidth = window.innerWidth;
		const width = Math.min(1, screenWidth / 1200);
		this.timer.setAttribute('width', width.toString());

		this.player.el.querySelector('a-camera')?.appendChild(this.timer);
		this.timer.setAttribute('position', '0 0.3 -0.5');
		const redLight = document.createElement('a-circle');
		redLight.setAttribute('color', 'red');
		redLight.setAttribute('radius', '1.2');
		redLight.setAttribute('position', '1.5 9 -65');
		scene.appendChild(redLight);
		const greenLight = document.createElement('a-circle');
		greenLight.setAttribute('color', 'lightgreen');
		greenLight.setAttribute('radius', '1.2');
		greenLight.setAttribute('position', '-1.5 9 -65');
		scene.appendChild(greenLight);
		this.audio = document.createElement('a-entity');
		this.audio.setAttribute(
			'sound',
			`
		src:url(/audio/squidgame.mp3);
		autoPlay:false;
		loop:false;
		positional:false;
		`
		);
		scene.appendChild(this.audio);
		this.gunshot = document.createElement('a-entity');
		this.gunshot.setAttribute(
			'sound',
			`
		src:url(/audio/gunshot.mp3);
		autoPlay:false;
		loop:false;
		positional:false;
		`
		);
		scene.appendChild(this.gunshot);

		let ceckAtNextTick = false;
		setInterval(() => {
			if (!this.gunshot || !this.audio || !this.timer || !this.player) return;

			switch (this.status) {
				case 'idle':
					if (this.timeToNextGame > 0) {
						this.timeToNextGame -= 1;
						this.timer.setAttribute(
							'value',
							'Time to next game: ' + this.timeToNextGame.toString().padStart(2, '0') + ' seconds'
						);

						if (this.timeToNextGame == 0) {
							this.status = 'playing';
						}
						if (!this.player) return;
					}
					break;
				case 'playing':
					this.timeLimit -= 1;
					this.timeUp += 1;
					if (this.timeUp % 9.4 < 5) {
						this.lightStatus = 'red';
						//red light
						if (!this.redAnimStarted) {
							girl.setAttribute('animation', {
								property: 'rotation',
								from: girl.getAttribute('rotation'),
								to: {
									x: 0,
									y: 0,
									z: 0
								},
								dur: 1000,
								easing: 'linear',
								loop: false
							});
							this.redAnimStarted = true;
							this.greenAnimStarted = false;
						}
						redLight.setAttribute('visible', 'true');
						greenLight.setAttribute('visible', 'false');
					} else {
						this.lightStatus = 'green';

						//green light
						if (!this.greenAnimStarted) {
							girl.setAttribute('animation', {
								property: 'rotation',
								from: girl.getAttribute('rotation'),
								to: {
									x: 0,
									y: 180,
									z: 0
								},
								dur: 1000,
								easing: 'linear',
								loop: false
							});
							this.greenAnimStarted = true;
							this.redAnimStarted = false;
						}
						if (redLight.getAttribute('visible') == true) {
							this.audio.components.sound.playSound();
						}

						redLight.setAttribute('visible', 'false');
						greenLight.setAttribute('visible', 'true');
					}
					if (this.timeLimit < 0) {
						this.gameOver();

						break;
					}

					const timeDisplay =
						Math.floor(this.timeLimit / 60) +
						':' +
						(this.timeLimit % 60).toString().padStart(2, '0');
					this.timer.setAttribute('value', timeDisplay);
					break;
				case 'gameover':
					this.timer.setAttribute('value', 'Game over');
					break;
				case 'finished':
					this.timer.setAttribute('value', 'You won!');
					break;
			}
		}, 1000);
	},
	tick: function () {
		//get how much player moved
		if (!this.player || !this.audio || !this.timer || !this.finishedDialog) return;
		this.playerPosition = this.player.position;
		switch (this.status) {
			case 'idle':
				if (this.player.position.z < -2) {
					this.player.position = {
						x: this.player.position.x,
						y: this.player.position.y,
						z: 0
					};
				}
				break;
			case 'playing':
				if (this.lightStatus == 'red') {
					if (
						Math.abs(this.playerPosition.x - this.playerOldPosition.x) > 0.01 ||
						Math.abs(this.playerPosition.y - this.playerOldPosition.y) > 0.01 ||
						Math.abs(this.playerPosition.z - this.playerOldPosition.z) > 0.01
					) {
						this.gameOver();
					}
				}
				if (this.player.position.z < -59) {
					this.timer.setAttribute('value', 'You won!');
					setTimeout(() => {
						this.finishedDialog.open();
					}, 1000);

					this.status = 'finished';
					break;
				}

				break;
		}
		this.playerOldPosition = this.playerPosition;
	},
	gameOver: async function () {
		if (!this.gunshot || !this.audio || !this.timer || !this.gameOverDialog || !this.player) return;
		const gunshot = this.gunshot.components.sound as any;
		gunshot.playSound();
		const audio = this.audio.components.sound as any;

		this.status = 'gameover';
		this.timer.setAttribute('value', 'Game over');
		const scull = new SharedObject({
			url: 'https://cdn.filestackcontent.com/bZEjisHVRke4JHUEEKmf',
			handle: 'bZEjisHVRke4JHUEEKmf',
			title: 'Skull',
			type: 'model/gltf-binary',
			components: JSON.stringify({
				position: this.player.position,
				rotation: {
					x: 0,
					y: Math.floor(Math.random() * 360),
					z: 0
				},
				scale: {
					x: 0.002,
					y: 0.002,
					z: 0.002
				}
			})
		});
		await scull.create();
		scull.attachElement();
		sharedObjects.add(scull);
		setTimeout(async () => {
			scull.updateComponents();
			if (!this.gameOverDialog) return;

			this.gameOverDialog.open();
		}, 1500);
	},
	reset() {
		if (!this.player || !this.gameOverDialog || !this.finishedDialog) return;
		this.player.position = { x: 0, y: 0, z: 0 };
		this.playerOldPosition = { x: 0, y: 0, z: 0 };
		this.playerMoving = false;
		this.status = 'idle';
		this.lightStatus = 'red';
		this.timeToNextGame = 10;
		this.timeLimit = 90;
		this.timeUp = 5;
		this.redAnimStarted = false;
		this.greenAnimStarted = false;
		this.gameOverDialog.close();
		this.finishedDialog.close();
	}
});
