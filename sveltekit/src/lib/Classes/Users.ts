import { writable } from 'svelte/store';
import type { Unit } from './Unit';
import type { User } from '$lib/types/User';

const UsersStore = writable([] as Unit[]);

class users {
	users: Unit[] = [];
	constructor() {}
	subscribe() {
		return UsersStore.subscribe((value) => (this.users = value));
	}
	add(user: Unit) {
		UsersStore.update((users) => {
			this.users = [...users, user];
			return this.users;
		});
	}
	remove(userId: string) {
		UsersStore.update((users) => {
			this.users = users.filter((user) => user.userId !== userId);
			return this.users;
		});
	}
	find(userId: string): Unit | false {
		return this.users.find((user) => user.userId === userId) || false;
	}
}
export const Users = new users();
