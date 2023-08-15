import axios from 'axios';
import { SharedObject } from './Classes/SharedObject';
import { sharedObjects } from './Classes/SharedObjects';
import { videoChat } from './Classes/VideoChat';
import type { File } from 'filestack-js/build/main/lib/api/upload';
import type { Me } from './Classes/Me';

export const appendObjectInTheRoom = async ({
	roomId,
	file,
	userId,
	me
}: {
	roomId: string;
	file: File;
	userId: string;
	me: Me;
}) => {
	const object = new SharedObject({
		room: roomId,
		type: file.mimetype,
		url: file.url,
		title: file.filename,
		handle: file.handle,
		user: userId,
		size: file.size,
		editable: 1,
		locked: false
	});
	sharedObjects.add(object);
	object.attachElement();
	await object.moveToMyFront(me.position, me.rotation);
	await object.create();
	console.log({ object });
	videoChat.sendMessage({
		key: 'objectCreate',
		id: object.id
	});
};
