import type { Unit } from '$lib/frontend/Classes/Unit';
import { Users } from '$lib/frontend/Classes/Users';
import { toast } from '$lib/frontend/toast';
import { _ } from '$lib/i18n';
import { RoomStore, type xyz } from '$lib/store';
import type { Entity } from 'aframe';
import { DateTime } from 'luxon';
import { Scene } from 'three';
AFRAME.registerComponent('squid-game', {
	seconds: 0,
	status: 'idle' as 'idle' | 'playing' | 'finished' | 'gameover',
	player: null as null | Unit,
	playerPosition: { x: 0, y: 0, z: 0 } as xyz,
	playerOldPosition: { x: 0, y: 0, z: 0 } as xyz,
	playerMoving: false,
	init: function () {
		this.player = Users.find(this.data.userId) as Unit;
		this.player.el.setAttribute('movement-controls', 'speed:0.2');
		console.log('squidgame initiated');
		this.seconds = DateTime.now().toFormat('ss');
		let timeToNextGame = this.seconds % 30;
		const timer = document.createElement('a-text');
		timer.setAttribute('align', 'center');
		timer.setAttribute('color', 'white');
		timer.setAttribute('width', 1);
		this.player.el.querySelector('a-camera')?.appendChild(timer);
		timer.setAttribute('position', '0 0.3 -0.5');
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
		const audio = document.createElement('a-sound');
		audio.setAttribute('src', '/audio/squidgame.mp3');
		audio.setAttribute('autoplay', 'false');
		audio.setAttribute('loop', 'false');
		audio.setAttribute('positional', 'false');
		scene.appendChild(audio);
		const gunshot = document.createElement('a-sound');
		gunshot.setAttribute('src', '/audio/gunshot.mp3');
		gunshot.setAttribute('autoplay', 'false');
		gunshot.setAttribute('loop', 'false');
		gunshot.setAttribute('positional', 'false');
		scene.appendChild(gunshot);
		let timeLimit = 120;
		let timeUp = 0;
		setInterval(() => {
			switch (this.status) {
				case 'idle':
					if (timeToNextGame > 0) {
						timeToNextGame -= 1;
						timer.setAttribute(
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
						redLight.setAttribute('visible', 'true');
						greenLight.setAttribute('visible', 'false');
						if (this.playerMoving) {
							gunshot.components.sound.playSound();
							this.status = 'gameover';
							timer.setAttribute('value', 'Game over');

							break;
						}
					} else {
						//green light
						console.log(redLight.getAttribute('visible'));
						if (redLight.getAttribute('visible') == true) {
							console.log('playing audio');
							audio.components.sound.playSound();
						}

						redLight.setAttribute('visible', 'false');
						greenLight.setAttribute('visible', 'true');
					}
					if (timeLimit < 0) {
						this.status = 'gameover';
						break;
					}
					if (this.player.position.z < -59) {
						toast(_('You won!'));
						timer.setAttribute('value', 'You won!');

						this.status = 'finished';
						break;
					}
					const timeDisplay =
						Math.floor(timeLimit / 60) + ':' + (timeLimit % 60).toString().padStart(2, '0');
					timer.setAttribute('value', timeDisplay);
					break;
				case 'gameover':
					timer.setAttribute('value', 'Game over');
					break;
				case 'finished':
					timer.setAttribute('value', 'You won!');
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
	}
});
