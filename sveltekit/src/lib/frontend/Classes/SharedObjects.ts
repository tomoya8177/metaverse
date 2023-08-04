import type { SharedObject } from './SharedObject';

class SharedObjects {
	items: SharedObject[] = [];
	add(item: SharedObject) {
		this.items.push(item);
	}
	remove(id: string) {
		this.items = this.items.filter((item) => item.id !== id);
	}
	get(id: string) {
		return this.items.find((item) => item.id === id);
	}
	filter(filter: (item: SharedObject) => boolean) {
		return this.items.filter(filter);
	}
}
export const sharedObjects = new SharedObjects();
