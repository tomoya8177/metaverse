export class SharedObject {
	id: string;
	url: string;
	type: string;
	size: number;
	title: string;
	createdAt: string;
	components: string;
	event: string;
	user: string;
	editable: boolean;
	handle: string;
	constructor({
		id,
		url,
		type,
		size,
		title,
		createdAt,
		components,
		event,
		user,
		editable,
		handle
	}: SharedObject) {
		this.id = id;
		this.url = url;
		this.type = type;
		this.size = size;
		this.title = title;
		this.createdAt = createdAt;
		this.components = components;
		this.event = event;
		this.user = user;
		this.editable = editable;
		this.handle = handle;
		const entity = document.createElement('a-entity');
		entity.setAttribute('id', id);
		if (this.type.includes('image')) {
			entity.setAttribute('geometry', {
				primitive: 'plane',
				height: 1,
				width: 1
			});
			entity.setAttribute('material', {
				src: url,
				side: 'double',
				transparent: true
			});
		}
		entity.setAttribute('name', this.title);
		entity.setAttribute('editable-object', '');
		if (this.editable) {
			entity.classList.add('clickable');
		}
		scene.appendChild(entity);
	}
	remove() {
		const entity = document.getElementById(this.id);
		if (!entity) return;
		scene.removeChild(entity);
	}
}
