import { writable, type Writable } from 'svelte/store';
import type { Unit } from './Unit';
import type { User } from '$lib/frontend/Classes/User';
import type { Mentor } from './Mentor';
import type { Me } from './Me';

export const UsersStore = writable([] as Unit[]);

class users {
	users: (Unit | Me | Mentor)[] = [];
	constructor() {}
	add(user: Unit) {
		UsersStore.update((users) => {
			this.users = [...users, user];
			return this.users;
		});
	}
	remove(userId: string) {
		UsersStore.update((users) => {
			this.users = users.filter((user) => user.id !== userId);
			return this.users;
		});
	}
	find(userId: string): Unit | Me | Mentor | false {
		return this.users.find((user) => user.id === userId) || false;
	}
	clear = () => {
		UsersStore.set([]);
	};
}
export const Users = new users();
