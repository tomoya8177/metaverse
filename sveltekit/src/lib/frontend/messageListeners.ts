import { Unit } from '$lib/frontend/Classes/Unit';
import { Users } from '$lib/frontend/Classes/Users';
import { videoChat } from '$lib/frontend/Classes/VideoChat';
import type { User } from '$lib/frontend/Classes/User';
import axios from 'axios';
import { SharedObject } from './Classes/SharedObject';
import { sharedObjects } from './Classes/SharedObjects';
import type { Entity } from 'aframe';
import { RoomStore } from '$lib/store';
import { toast } from './toast';
import { _ } from '$lib/i18n';
import type { Room } from './Classes/Room';

let room: Room;
RoomStore.subscribe((r) => {
	if (!r) return;
	room = r;
});

export const messageListeners = () => {
	videoChat.listenTo('position', async (data) => {
		let unit = Users.find(data.user.id) as Unit;
		if (!unit) {
			unit = welcomeUnit(data.user);
		}
		if (!unit) return;
		unit.animatePosition(data.position);
		unit.rotation = data.rotation;
	});
	videoChat.listenTo('updateProfile', (data) => {
		const unit = Users.find(data.user.id) as Unit;
		if (!unit) return;
		unit.userData = data.user;
		unit.resetProfile();
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
		const object = document.getElementById(data.id);
		if (!object) return;
		object.parentNode?.removeChild(object);
	});
	videoChat.listenTo('moveMentor', (data) => {
		room.mentorData.go({
			targetPosition: data.position,
			targetRotation: data.rotation
		});
	});
	videoChat.listenTo('jump', (data) => {
		const unit = Users.find(data.userId) as Unit;
		if (!unit) return;
		unit.avatarContainer.setAttribute('jump', 'acceleration:0.1;');
	});
};

export const welcomeUnit = (user: User): Unit => {
	const ifExisting = Users.find(user.id);
	if (ifExisting) {
		return ifExisting as Unit;
	}
	const userUnit = new Unit(user);
	Users.add(userUnit);
	return userUnit;
};
export const messageUnlisteners = () => {
	videoChat.dontListenTo('position');
	videoChat.dontListenTo('updateProfile');
};
