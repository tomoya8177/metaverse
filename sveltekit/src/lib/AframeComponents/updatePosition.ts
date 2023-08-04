import { Message } from '$lib/frontend/Classes/Message';
import type { Room } from '$lib/frontend/Classes/Room';
import type { SharedObject } from '$lib/frontend/Classes/SharedObject';
import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
import type { User } from '$lib/frontend/Classes/User';
import { Users } from '$lib/frontend/Classes/Users';
import { videoChat } from '$lib/frontend/Classes/VideoChat';
import { aiSpeaksOut } from '$lib/frontend/aiSpeaksOut';
import { RoomStore, UserStore, type xyz } from '$lib/store';
import { DateTime } from 'luxon';
let user: User;
UserStore.subscribe((u) => {
	user = u;
});
let room: Room;
RoomStore.subscribe((r) => {
	room = r;
});
AFRAME.registerComponent('update-position', {
	init: function () {
		this.me = Users.find(this.el.id);
		console.log('update position', this.me);
		this.lastPosition = { ...this.me.position };
		this.lastRotation = { ...this.me.rotation };
	},
	tick: function () {
		if (this.me === undefined) return;

		const currentTime = Date.now();
		const timeSinceLastPositionChange = currentTime - this.lastPositionChangeTime;

		if (
			positionRotationChanged(
				{
					position: this.me.position,
					rotation: this.me.rotation
				},
				{
					position: this.lastPosition,
					rotation: this.lastRotation
				}
			)
		) {
			this.lastPositionChangeTime = currentTime;
			this.lastPosition = { ...this.me.position };
			this.lastRotation = { ...this.me.rotation };
			videoChat.sendMessage({
				key: 'position',
				user,
				position: this.me.position,
				rotation: { ...this.me.rotation }
			});
			// io.emit('position', {
			// 	position: this.me.position,
			// 	rotation: { ...this.me.rotation }
			// });
		} else {
			if (timeSinceLastPositionChange >= 2000) {
				//check if there's any objects near by
				let closestObject: SharedObject | null = null;
				sharedObjects.items
					.filter((object) => !object.explained)
					.forEach((object) => {
						//if this is already explained, skip
						const distance = this.el.object3D.position.distanceTo(object.position);
						let minimumDistance = 3;
						if (distance < 3 && distance <= minimumDistance) {
							minimumDistance = distance;
							closestObject = object;
						}
					});
				if (!closestObject) return;
				console.log('closestObject', closestObject);
				closestObject.explained = true;
				if (!closestObject.description) return;
				const message = new Message({
					user: room.mentorData?.mentor,
					body: closestObject.description,
					room: room.id,
					createdAt: DateTime.now().toISO(),
					isTalking: true
				});

				aiSpeaksOut(closestObject.description);
			}
		}
	}
});

const positionRotationChanged = (
	current: { position: xyz; rotation: xyz },
	past: {
		position: xyz;
		rotation: xyz;
	}
) => {
	let threshold = 0.01;
	return (
		current.position.x - past.position.x > threshold ||
		current.position.y - past.position.y > threshold ||
		current.position.z - past.position.z > threshold ||
		current.rotation.x !== past.rotation.x ||
		current.rotation.y !== past.rotation.y ||
		current.rotation.z !== past.rotation.z
	);
};
