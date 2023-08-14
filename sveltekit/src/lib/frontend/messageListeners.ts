import { Unit } from '$lib/frontend/Classes/Unit';
import { Users } from '$lib/frontend/Classes/Users';
import { videoChat } from '$lib/frontend/Classes/VideoChat';
import type { User } from '$lib/frontend/Classes/User';
import axios from 'axios';
import { SharedObject } from './Classes/SharedObject';
import { sharedObjects } from './Classes/SharedObjects';
import type { Entity } from 'aframe';
import { transportMentor } from './callAIMentor';
import type { Room } from 'twilio-video';
import { RoomStore } from '$lib/store';

let room: Room;
RoomStore.subscribe((r) => {
	room = r;
});

export const messageListeners = () => {
	videoChat.listenTo('handshake', async (data) => {
		console.log('handshale received from ', data.user.nickname);
		const userUnit = welcomeUnit(data.user);
		if (!userUnit) return;
		userUnit.position = data.position;
		userUnit.rotation = data.rotation;
	});
	videoChat.listenTo('position', async (data) => {
		let unit = Users.find(data.user.id);
		if (!unit) {
			unit = welcomeUnit(data.user);
		}
		if (!unit) return; // lets return until unit handshake complete
		unit.position = data.position;
		unit.rotation = data.rotation;
	});
	videoChat.listenTo('updateProfile', (data) => {
		const unit = Users.find(data.user.id);
		if (!unit) return;
		unit.nickname = data.nickname;
		unit.avatarURL = data.avatarURL;
	});
	videoChat.listenTo('objectCreate', async (data) => {
		const objectData = await axios.get('/api/objects/' + data.id).then((res) => res.data);
		const object = new SharedObject(objectData);
		object.attachElement();
		sharedObjects.add(object);
	});
	videoChat.listenTo('objectPosition', (data) => {
		const object = sharedObjects.get(data.object.id);
		if (!object) return;
		object.el?.setAttribute('position', data.position);
		object.el?.setAttribute('rotation', data.rotation);
		object.el?.setAttribute('scale', data.scale);

		if (object.isSphere) {
			object.el?.setAttribute('geometry', { radius: data.radius });
		}
		object.setComponents();
	});
	videoChat.listenTo('objectUpdate', (data) => {
		console.log('received upject update', data);
		const object = sharedObjects.get(data.id);
		if (!object) return;
		if (typeof data.title != 'undefined') object.title = data.title;
		if (typeof data.linkTo != 'undefined') object.linkTo = data.linkTo;
		if (typeof data.description != 'undefined') object.description = data.description;
		if (typeof data.withCaption != 'undefined') object.withCaption = data.withCaption;
		if (typeof data.captionUrl != 'undefined') object.captionUrl = data.captionUrl;
		if (typeof data.url != 'undefined') object.url = data.url;
		if (data.isSphere != undefined) {
			object.isSphere = data.isSphere;
			object.updateEntityGeometryAndMaterial();
		}
		if (object.type.includes('image')) {
			object.refreshPreview();
		}
	});
	videoChat.listenTo('objectDelete', (data) => {
		console.log('delete revceived', data);
		const object = document.getElementById(data.id);
		if (!object) return;
		object.parentNode?.removeChild(object);
	});
	videoChat.listenTo('moveMentor', (data) => {
		transportMentor({
			mentorEl: document.getElementById(room.mentorData.user) as Entity,
			position: data.position,
			rotation: data.rotation
		});
	});
};

export const welcomeUnit = (user: User): Unit => {
	const ifExisting = Users.find(user.id);
	if (ifExisting) {
		return ifExisting;
	}
	const userUnit = new Unit(user);
	userUnit.nickname = user.nickname;
	userUnit.avatarURL =
		user.avatarURL || '/preset-avatars/b3c158be8e39d28a8cc541052c7497cfa9d7bdbe.glb';
	Users.add(userUnit);
	return userUnit;
};
export const messageUnlisteners = () => {
	videoChat.dontListenTo('handshake');
	videoChat.dontListenTo('position');
	videoChat.dontListenTo('updateProfile');
};
