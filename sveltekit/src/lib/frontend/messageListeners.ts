import { Unit } from '$lib/Classes/Unit';
import { Users } from '$lib/Classes/Users';
import { videoChat } from '$lib/Classes/VideoChat';
import axios from 'axios';

export const messageListeners = () => {
	videoChat.listenTo('handshake', async (data) => {
		const userUnit = await welcomeUnit(data.user.id);
		if (!userUnit) return;
		userUnit.position = data.position;
		userUnit.rotation = data.rotation;
	});
	videoChat.listenTo('position', async (data) => {
		let unit = Users.find(data.user.id);
		if (!unit) {
			unit = await welcomeUnit(data.user.id);
		}
		if (!unit) return;
		unit.position = data.position;
		unit.rotation = data.rotation;
	});
	videoChat.listenTo('updateProfile', (data) => {
		const unit = Users.find(data.user.id);
		if (!unit) return;
		unit.nickname = data.nickname;
	});
	videoChat.listenTo('objectPosition', (data) => {
		const object = document.getElementById(data.object.id);
		if (!object) return;
		object.setAttribute('position', data.position);
		object.setAttribute('rotation', data.rotation);
		object.setAttribute('scale', data.scale);
	});
};

export const welcomeUnit = async (unitId: string): Promise<Unit> => {
	const unit = await axios.get('/api/users/' + unitId).then((res) => res.data);
	console.log({ unit });
	//let's check again before appending duplicate unit
	if (Users.find(unit.id)) return Users.find(unit.id);
	const userUnit = new Unit(unit.id);
	userUnit.nickname = unit.nickname;
	userUnit.avatarURL =
		unit.avatarURL || 'preset-avatars/b3c158be8e39d28a8cc541052c7497cfa9d7bdbe.glb';
	Users.add(userUnit);
	return userUnit;
};
export const messageUnlisteners = () => {
	videoChat.dontListenTo('handshake');
	videoChat.dontListenTo('position');
	videoChat.dontListenTo('updateProfile');
};
