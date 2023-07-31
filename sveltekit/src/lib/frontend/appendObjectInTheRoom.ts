import axios from 'axios';
import { SharedObject } from './Classes/SharedObject';
import { sharedObjects } from './Classes/SharedObjects';
import { videoChat } from './Classes/VideoChat';

export const appendObjectInTheRoom = async ({ eventId, file, userId, me }) => {
	const createdFile = await axios
		.post('/api/objects', {
			event: eventId,
			type: file.mimetype,
			url: file.url,
			title: file.filename,
			handle: file.handle,
			user: userId,
			size: file.size,
			editable: 1,
			components: JSON.stringify({
				position: {
					x: 0,
					y: 0,
					z: 0
				},
				rotation: {
					x: 0,
					y: 0,
					z: 0
				},
				scale: {
					x: 1,
					y: 1,
					z: 1
				}
			})
		})
		.then((res) => res.data);
	const object = new SharedObject(createdFile);
	if (!me) return console.error('me is null');
	console.log('me', me);
	object.moveToMyFront(me.position, me.rotation);
	object.locked = false;
	sharedObjects.add(object);
	videoChat.sendMessage({
		key: 'objectCreate',
		id: object.id
	});
};
