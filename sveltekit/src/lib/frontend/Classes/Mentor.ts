import axios from 'axios';
import { DBObject } from './DBObject';
import { User } from './User';

export class Mentor extends DBObject {
	user: string;
	userData: User | null = null;
	constructor(data: any) {
		data.table = 'mentors';
		super(data);
		this.user = data.user;
	}
	async init() {
		this.userData = await axios.get('/api/users/' + this.user).then((res) => {
			return new User(res.data);
		});
	}
}
