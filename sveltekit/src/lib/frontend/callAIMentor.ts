import axios from 'axios';
import { Users } from './Classes/Users';
import { sharedObjects } from './Classes/SharedObjects';
import type { xyz } from '$lib/store';
import type { Mentor } from './Classes/Mentor';
import { RoomStore, UserStore } from '$lib/store';
import type { Room } from './Classes/Room';
import type { User } from './Classes/User';

import type { Entity } from 'aframe';
let room: Room;
RoomStore.subscribe((r) => {
	room = r;
});
let user: User;
UserStore.subscribe((u) => {
	user = u;
});

export const transportMentor = async ({
	position,
	rotation,
	mentorEl
}: {
	position: xyz;
	rotation: xyz;
	mentorEl: Entity;
}): Promise<void> => {
	mentorEl.setAttribute('animation', {
		property: 'position',
		to: `${position.x} ${position.y} ${position.z}`,
		dur: 2000,
		easing: 'easeInOutQuad'
	});
	mentorEl.setAttribute('animation__rotation', {
		property: 'rotation',
		to: `${rotation.x} ${rotation.y} ${rotation.z}`,
		dur: 2000,
		easing: 'easeInOutQuad'
	});
};
