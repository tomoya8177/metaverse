import type { Unit } from '$lib/frontend/Classes/Unit';
import { Users } from '$lib/frontend/Classes/Users';
import type { Entity } from 'aframe';

AFRAME.registerComponent('maze-game', {
	player: null as null | Unit,
	schema: {
		userId: { type: 'string' }
	},
	init: function () {
		this.player = Users.find(this.data.userId) as Unit;
		if (!this.player) return;
		this.player.position = { x: 0, y: 0, z: 0 };
	}
});
