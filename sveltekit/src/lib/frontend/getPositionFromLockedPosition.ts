import { degree2radian } from '$lib/math/degree2radians';
import type { xyz } from '$lib/store';

export const getPositionFromLockedPosition = (lockedPosition: number): xyz => {
	const angle = lockedPosition * 30;
	const offsetVector = new THREE.Vector3(0, 1.65, -5);
	offsetVector.applyAxisAngle(new THREE.Vector3(0.001, 1, 0.001), degree2radian(angle));
	return { x: offsetVector.x, y: offsetVector.y, z: offsetVector.z };
};
