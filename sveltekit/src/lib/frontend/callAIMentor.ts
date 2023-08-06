import axios from 'axios';
import { Users } from './Classes/Users';
import { sharedObjects } from './Classes/SharedObjects';
import type { xyz } from '$lib/store';
import type { Mentor } from './Classes/Mentor';
import { RoomStore, UserStore } from '$lib/store';
import type { Room } from './Classes/Room';
import type { User } from './Classes/User';
import { degree2radian } from '$lib/math/degree2radians';
import type { Entity } from 'aframe';
import { videoChat } from './Classes/VideoChat';
let room: Room;
RoomStore.subscribe((r) => {
	room = r;
});
let user: User;
UserStore.subscribe((u) => {
	user = u;
});

export const callAIMentor = async (mentor: Mentor = null): Promise<void> => {
	if (mentor === null) {
		mentor = room.mentorData;
	}
	const userUnit = Users.find(user.id);
	const vector = new THREE.Vector3(0, 0, -1.2);
	vector.applyAxisAngle(
		new THREE.Vector3(0, 1, 0),
		degree2radian(userUnit.el.getAttribute('rotation').y + 30)
	);

	const targetPosition = {
		x: userUnit.el.object3D.position.x + vector.x,
		y: userUnit.el.object3D.position.y,
		z: userUnit.el.object3D.position.z + vector.z
	};
	const targetRotation = {
		x: 0,
		y: userUnit.el.getAttribute('rotation').y + 210,
		z: 0
	};
	console.log({ targetPosition });
	// get distance between the target and aiMentor

	// how long it takes to get to the target if aiMentor walks 2m/s

	//animate the aiMentor to the targetPosition
	transportMentor({
		mentorEl: document.getElementById(mentor.user) as Entity,
		position: targetPosition,
		rotation: targetRotation
	});
	videoChat.sendMessage({
		key: 'moveMentor',
		position: targetPosition,
		rotation: targetRotation
	});
};
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
