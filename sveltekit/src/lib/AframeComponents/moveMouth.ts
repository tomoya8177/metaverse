import { Users } from '$lib/frontend/Classes/Users';
import 'aframe';
AFRAME.registerComponent('move-mouth', {
	schema: {
		userId: { type: 'string', default: '' }
	},
	init: function () {
		this.avatar = this.el.parentNode.querySelector('a-gltf-model');
		//traverse the gltf model to find the head
		this.avatar.addEventListener('model-loaded', () => {
			this.head = findNode(this.avatar.object3D, 'Wolf3D_Avatar');
		});
		this.unit = Users.find(this.data.userId);
	},
	tick: function () {
		//get the audio level from the analyser node
		//    this.unit.audioLevel
		//open mouth when audio level is more than 5
		if (!this.head) {
			console.log('no head found');
			return;
		}
		if (this.unit.audioLevel > 5) {
			const level = (this.unit.audioLevel - 5) / 5;
			setValue(this.head, 'jawOpen', level);
			setValue(this.head, 'mouthOpen', level);
			//rotate head a little
			this.avatar.setAttribute('rotation', level * 2 + ' 180 0');
		} else {
			setValue(this.head, 'jawOpen', 0);
			setValue(this.head, 'mouthOpen', 0);
			this.avatar.setAttribute('rotation', '0 180 0');
		}
	}
});

AFRAME.registerComponent('smile', {
	init: function () {
		//traverse the gltf model to find the head
		this.el.addEventListener('model-loaded', () => {
			this.head = findNode(this.el.object3D, 'Wolf3D_Avatar');
			setValue(this.head, 'mouthSmile', 0.7);
		});
	}
});
const setValue = (head, key, val) => {
	var index = head.morphTargetDictionary[key];
	head.morphTargetInfluences[index] = val;
};
const findNode = (node, name) => {
	//traverse through node
	let match = null;
	node.traverse((child) => {
		if (child.name === name) {
			match = child;
		}
	});
	return match;
};
