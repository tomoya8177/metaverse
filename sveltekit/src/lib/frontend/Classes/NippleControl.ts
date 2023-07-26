import { radian2degree } from '$lib/math/degree2radians';

class NippleControl {
	distance: number = 0;
	direction: number = 0;
	status: string = 'idle';
	get angle() {
		return radian2degree(this.direction);
	}
}
export const nippleControl = new NippleControl();
