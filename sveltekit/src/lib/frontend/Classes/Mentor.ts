import axios from 'axios';
import { DBObject } from './DBObject';
import { User } from './User';
import { PUBLIC_LOCALHOST } from '$env/static/public';

export class Mentor extends DBObject {
	user: string;
	userData: User | null = null;
	constructor(data: any) {
		data.table = 'mentors';
		super(data);
		this.user = data.user;
	}
	async init() {
		this.userData = await axios.get(PUBLIC_LOCALHOST + '/api/users/' + this.user).then((res) => {
			return new User(res.data);
		});
	}
}
