import { Me } from '$lib/frontend/Classes/Me';
import type { Mentor } from '$lib/frontend/Classes/Mentor';
import { Message } from '$lib/frontend/Classes/Message';
import type { Room } from '$lib/frontend/Classes/Room';
import type { SharedObject } from '$lib/frontend/Classes/SharedObject';
import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
import { Unit } from '$lib/frontend/Classes/Unit';
import type { User } from '$lib/frontend/Classes/User';
import { Users } from '$lib/frontend/Classes/Users';
import { videoChat } from '$lib/frontend/Classes/VideoChat';
import { aiSpeaksOut } from '$lib/frontend/aiSpeaksOut';
import { cookies } from '$lib/frontend/cookies';
import { _ } from '$lib/i18n';
import { RoomStore, TextChatOpen, UserStore, AISpeaks, type xyz } from '$lib/store';
import axios from 'axios';
import { DateTime } from 'luxon';
let user: User;
UserStore.subscribe((u) => {
	user = u;
});
let room: Room;
RoomStore.subscribe((r) => {
	if (!r) return;
	room = r;
});
let aiSpeaks = false;
AISpeaks.subscribe((value) => {
	aiSpeaks = value;
});
AFRAME.registerComponent('update-position', {
	me: null as Me | null,
	lastPosition: { x: 0, y: 0, z: 0 } as xyz,
	lastRotation: { x: 0, y: 0, z: 0 } as xyz,
	lastPositionChangeTime: 0,
	init: function () {
		this.me = (Users.find(this.el.id) as Me) || null;
		this.lastPosition = { ...this.me.position };
		this.lastRotation = { ...this.me.rotation };
	},
	tick: function () {
		if (this.me === undefined) return;

		const currentTime = Date.now();
		const timeSinceLastPositionChange = currentTime - this.lastPositionChangeTime;

		if (
			this.me &&
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
		}
		if (!room.mentor) return;
		if (
			this.me &&
			positionNotChanged(
				{
					position: this.me.position,
					rotation: this.me.rotation
				},
				{
					position: this.lastPosition,
					rotation: this.lastRotation
				}
			) &&
			timeSinceLastPositionChange > 1000
		) {
			//check if there's any objects near by
			let closestObject: SharedObject | null = null;
			sharedObjects.items
				.filter((object) => !object.explained && object.type != 'screen')
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
			closestObject = closestObject as SharedObject;
			closestObject.explained = true;
			if (!closestObject.description) return;
			const me = Users.find(user.id) as Me;
			if (me) room.mentorData.come(me);

			const question = `${_('Can you tell me anything you know about the object, which ID is ')}${
				closestObject.id
			} ${_('and title is ')}${closestObject.title}? ${_(
				'Try not to make it boring just by reading out the description. Do not repeat the object ID. Answer in less than 100 words.'
			)}`;
			axios
				.post('/mentor/' + room.mentor + '/' + videoChat.room?.sid, {
					type: 'room',
					roomId: room.id,
					body: question,
					channelId: videoChat.room?.sid
				})
				.then((res) => {
					console.log({ res });
					const message = new Message({
						user: room.mentorData?.user,
						body: res.data.text,
						room: room.id,
						createdAt: DateTime.now().toISO(),
						isTalking: true
					});
					message.createSendOutAndPush();
					if (!aiSpeaks) {
						TextChatOpen.set(true);
						return;
					}
					room.mentorData.speak(res.data.text);
				});

			//calll the mentor with old model

			// let content = `${user.nickname} is looking at the ${closestObject.shortType}, ${closestObject.title}, whose description is: ${closestObject.description}.`;
			// //if there's an event attached, include it's data as well.
			// if (closestObject.attachedEvent) {
			// 	content += `There is an event attached. ${closestObject.attachedEvent.startString}`;
			// 	if (closestObject.attachedEvent.myAttendance) {
			// 		content += `User's attendance status for this event is ${closestObject.attachedEvent.myAttendance.status}.`;
			// 	}
			// }
			// content += `
			// 		Tell the context of the description to the user. Try not to make it boring just by reading out the description. Encourage the user to seek more detail about the context. Answer in less than 100 words.
			// 	Make sure to answer in the user's prefered language based on their locale setting. User's prefered language locale is ${cookies.get(
			// 		'locale'
			// 	)}. Answer to user's question starting with calling user's nickname so everyone knows it is the answer for the particular user.`;
			// axios
			// 	.post('/mentor', {
			// 		appendToChannel: room.id,

			// 		messages: [
			// 			{
			// 				role: 'system',
			// 				content
			// 			}
			// 		]
			// 	})
			// 	.then((res) => {
			// 		console.log({ res });
			// 		const message = new Message({
			// 			user: room.mentorData?.user,
			// 			body: res.data.response.content,
			// 			room: room.id,
			// 			createdAt: DateTime.now().toISO(),
			// 			isTalking: true
			// 		});
			// 		message.createSendOutAndPush();
			// 		if (!aiSpeaks) {
			// 			TextChatOpen.set(true);
			// 			return;
			// 		}
			// 		room.mentorData.speak(res.data.response.content);
			// 		//aiSpeaksOut(res.data.response.content, Users.find(room.mentorData.user) || null);
			// 	});
		}
	}
});

const positionNotChanged = (
	current: { position: xyz; rotation: xyz },
	past: {
		position: xyz;
		rotation: xyz;
	}
): boolean => {
	let threshold = 0.1;
	return (
		current.position.x - past.position.x < threshold &&
		current.position.y - past.position.y < threshold &&
		current.position.z - past.position.z < threshold
	);
};

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
