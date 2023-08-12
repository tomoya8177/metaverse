import axios from 'axios';
import { SharedObject } from './Classes/SharedObject';
import { sharedObjects } from './Classes/SharedObjects';
export const loadSharedObjects = async (roomId: string): Promise<void> => {
	const models = await axios.get('/api/objects?room=' + roomId).then((res) => res.data);
	const promises = models.map((model: SharedObject) => {
		const sharedObject = new SharedObject(model);
		sharedObject.attachElement();
		if (sharedObject.asset && sharedObject.type.includes('video')) {
			//stop autoplay
			sharedObject.asset.autoplay = false;
		}
		sharedObjects.add(sharedObject);
		return sharedObject.loadAttachedEvent();
	});
	await Promise.all(promises);
	return;
};
