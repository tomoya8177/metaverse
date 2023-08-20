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
	init: async function () {
		const scene = document.querySelector('a-scene');
		this.player = Users.find(this.data.userId) as Unit;
		this.player.el.setAttribute('movement-controls', 'speed:0.2');
		this.player.el.setAttribute('my-touch2-controls', 'speed:0.2');
		const girl = document.createElement('a-gltf-model');
		girl.setAttribute('src', 'url(/models/squid_game_doll/scene.gltf)');
		girl.setAttribute('position', '0 0 -60');
		girl.setAttribute('scale', '0.25 0.25 0.25');

		scene.appendChild(girl);

		this.seconds = Math.floor(
			DateTime.fromISO(await axios.get('/api/serverTime').then((res) => res.data)).toSeconds()
		);
		let timeToNextGame = this.seconds % 30;
		if (timeToNextGame < 10) timeToNextGame += 30;
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
		let timeLimit = 120;
		let timeUp = 0;
		let redAnimStarted = false;
		let greenAnimStarted = false;
		let checkAtNextTick = false;
		setInterval(() => {
			if (!this.gunshot || !this.audio || !this.timer || !this.player) return;

			switch (this.status) {
				case 'idle':
					if (timeToNextGame > 0) {
						timeToNextGame -= 1;
						this.timer.setAttribute(
							'value',
							'Time to next game: ' + timeToNextGame.toString().padStart(2, '0') + ' seconds'
						);

						if (timeToNextGame == 0) {
							this.status = 'playing';
						}
						if (!this.player) return;
						if (this.player.position.z < -2) {
							this.player.position = {
								x: this.player.position.x,
								y: this.player.position.y,
								z: 0
							};
						}
					}
					break;
				case 'playing':
					timeLimit -= 1;
					timeUp += 1;
					if (timeUp % 9.4 < 5) {
						//red light
						console.log('emitting to red');
						if (!redAnimStarted) {
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
							redAnimStarted = true;
							greenAnimStarted = false;
						}
						redLight.setAttribute('visible', 'true');
						greenLight.setAttribute('visible', 'false');
						if (this.playerMoving && checkAtNextTick) {
							this.gameOver();
							break;
						}
						checkAtNextTick = true;
					} else {
						//green light
						checkAtNextTick = false;
						console.log('emitting to green');
						if (!greenAnimStarted) {
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
							greenAnimStarted = true;
							redAnimStarted = false;
						}
						if (redLight.getAttribute('visible') == true) {
							this.audio.components.sound.playSound();
						}

						redLight.setAttribute('visible', 'false');
						greenLight.setAttribute('visible', 'true');
					}
					if (timeLimit < 0) {
						this.gameOver();

						break;
					}
					if (this.player.position.z < -59) {
						this.audio.components.sound.pauseSound();
						this.timer.setAttribute('value', 'You won!');

						this.status = 'finished';
						break;
					}
					const timeDisplay =
						Math.floor(timeLimit / 60) + ':' + (timeLimit % 60).toString().padStart(2, '0');
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
		if (!this.player) return;
		this.playerPosition = this.player.position;
		if (
			this.status == 'playing' &&
			(Math.abs(this.playerPosition.x - this.playerOldPosition.x) > 0.01 ||
				Math.abs(this.playerPosition.y - this.playerOldPosition.y) > 0.01 ||
				Math.abs(this.playerPosition.z - this.playerOldPosition.z) > 0.01)
		) {
			console.log('player moved');
			this.playerMoving = true;
		} else {
			this.playerMoving = false;
		}
		this.playerOldPosition = this.playerPosition;
	},
	gameOver: function () {
		if (!this.gunshot || !this.audio || !this.timer) return;
		const gunshot = this.gunshot.components.sound as any;
		gunshot.playSound();
		const audio = this.audio.components.sound as any;
		audio.pauseSound();

		this.status = 'gameover';
		this.timer.setAttribute('value', 'Game over');
		setTimeout(async () => {
			if (await myConfirm(_('Do you want to play again?'))) {
				location.reload();
			}
		}, 1500);
	}
});
