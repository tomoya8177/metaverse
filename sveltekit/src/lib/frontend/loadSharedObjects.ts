import axios from 'axios';
import { SharedObject } from './Classes/SharedObject';
import { sharedObjects } from './Classes/SharedObjects';
export const loadSharedObjects = async (roomId: string) => {
	const models = await axios.get('/api/objects?room=' + roomId).then((res) => res.data);
	models.forEach((model: SharedObject) => {
		const sharedObject = new SharedObject(model);
		sharedObject.attachElement();
		if (sharedObject.asset && sharedObject.type.includes('video')) {
			//stop autoplay
			sharedObject.asset.autoplay = false;
		}
		sharedObjects.add(sharedObject);
	});
};
