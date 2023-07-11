import { Users } from '$lib/Classes/Users';
import { videoChat } from '$lib/Classes/VideoChat';
import { UserStore, type xyz } from '$lib/store';
import 'aframe';
let user: User;
UserStore.subscribe((u) => {
	user = u;
});
AFRAME.registerComponent('update-position', {
	init: function () {
		this.me = Users.find(this.el.id);
		console.log('update position', this.me);
		this.lastPosition = { ...this.me.position };
		this.lastRotation = { ...this.me.rotation };
	},
	tick: function () {
		if (this.me === undefined) return;
		if (
			positionRotationChanged(
				{
					position: this.me.position,
					rotation: this.me.rotation
				},
				{
					position: this.lastPosition,
					rotation: this.lastRotation
				}
			)
		) {
			this.lastPosition = { ...this.me.position };
			this.lastRotation = { ...this.me.rotation };
			videoChat.sendMessage({
				key: 'position',
				user,
				position: this.me.position,
				rotation: { ...this.me.rotation }
			});
			// io.emit('position', {
			// 	position: this.me.position,
			// 	rotation: { ...this.me.rotation }
			// });
		}
	}
});

const positionRotationChanged = (
	current: { position: xyz; rotation: xyz },
	past: {
		position: xyz;
		rotation: xyz;
	}
) => {
	let threshold = 0.01;
	return (
		current.position.x - past.position.x > threshold ||
		current.position.y - past.position.y > threshold ||
		current.position.z - past.position.z > threshold ||
		current.rotation.x !== past.rotation.x ||
		current.rotation.y !== past.rotation.y ||
		current.rotation.z !== past.rotation.z
	);
};
