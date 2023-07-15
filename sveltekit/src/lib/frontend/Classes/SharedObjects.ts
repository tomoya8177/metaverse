class SharedObjects {
	items: any[] = [];
	add(item: any) {
		this.items.push(item);
	}
	remove(id: string) {
		this.items = this.items.filter((item) => item.id !== id);
	}
	get(id: string) {
		return this.items.find((item) => item.id === id);
	}
}
export const sharedObjects = new SharedObjects();
