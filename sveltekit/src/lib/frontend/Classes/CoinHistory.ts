import { DBObject } from './DBObject';

export class CoinHistory extends DBObject {
	user: string;
	source: string;
	action: string;
	coins: number;
	constructor(data: any) {
		data.table = 'coinHistory';
		super(data);
		this.user = data.user || '';
		this.source = data.source || '';
		this.action = data.action || '';
		this.coins = data.coins || 0;
	}
}
