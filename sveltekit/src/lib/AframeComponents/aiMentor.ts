import 'aframe';
import { UserStore } from '$lib/store';
import type { User } from '$lib/frontend/Classes/User';
import { degree2radian } from '$lib/math/degree2radians';
import { type Entity, THREE } from 'aframe';

let user: User;
UserStore.subscribe((obj) => {
	user = obj;
	console.log({ user });
});
AFRAME.registerComponent('ai-mentor', {
	init: function () {
		this.interval = setInterval(() => {
			const theRig = document.getElementById(user.id) as Entity;
			if (!theRig) return;
			//get position of the point 2 meters away from the theRig
			const vector = new THREE.Vector3(0, 0, -1.2);
			//apply rotation to the vector
			vector.applyAxisAngle(
				new THREE.Vector3(0, 1, 0),
				degree2radian(theRig.getAttribute('rotation').y)
			);
			const targetPosition = {
				x: theRig.object3D.position.x + vector.x,
				y: theRig.object3D.position.y,
				z: theRig.object3D.position.z + vector.z
			};
			console.log({ targetPosition });

			// get distance between the target and aiMentor
			const distance = this.el.object3D.position.distanceTo(
				new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z)
			);
			if (distance < 1) return;
			if (distance > 10) return;
			// how long it takes to get to the target if aiMentor walks 2m/s

			//animate the aiMentor to the targetPosition
			this.el.setAttribute('animation', {
				property: 'position',
				to: `${targetPosition.x} ${targetPosition.y} ${targetPosition.z}`,
				dur: 3000,
				easing: 'easeInOutQuad'
			});
			this.el.setAttribute('animation__rotation', {
				property: 'rotation',
				to: `0 ${theRig.getAttribute('rotation').y + 180} 0`,
				dur: 3000,
				easing: 'easeInOutQuad'
			});
			//animate the aiMentor to look at theRig
		}, 3000);
	}
});
