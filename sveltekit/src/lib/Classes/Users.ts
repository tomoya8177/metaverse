import type { Unit } from './Unit';

class users {
	users: Unit[] = [];
	constructor() {}
	add(user: Unit) {
		this.users.push(user);
	}
	remove(userId: string) {
		this.users = this.users.filter((user) => user.userId !== userId);
	}
	find(userId: string) {
		return this.users.find((user) => user.userId === userId);
	}
}
export const Users = new users();
