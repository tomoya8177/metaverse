import axios from 'axios';
import { SharedObject } from './Classes/SharedObject';
import { sharedObjects } from './Classes/SharedObjects';
export const loadSharedObjects = async (eventId: string) => {
	const models = await axios.get('/api/objects?event=' + eventId).then((res) => res.data);
	models.forEach((model: SharedObject) => {
		const sharedObject = new SharedObject(model);
		if (sharedObject.asset && sharedObject.type.includes('video')) {
			//stop autoplay
			sharedObject.asset.autoplay = false;
		}
		sharedObjects.add(sharedObject);
	});
};
