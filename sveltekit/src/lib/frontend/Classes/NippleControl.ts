import { degree2radian } from 'mymetaverse-helper';

class NippleControl {
	distance: number = 0;
	direction: number = 0;
	distanceX: number = 0;
	distanceY: number = 0;
	status: string = 'idle';

	show(): void {
		document.querySelector('.nippleControl').style.display = 'block';
	}
	hide(): void {
		document.querySelector('.nippleControl').style.display = 'none';
	}
}
export const nippleControl = new NippleControl();
