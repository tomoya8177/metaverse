import type { Unit } from '$lib/frontend/Classes/Unit';
import { Users } from '$lib/frontend/Classes/Users';
import 'aframe';
import type { Entity } from 'aframe';
import type { Object3D, SkinnedMesh } from 'three';
AFRAME.registerComponent('move-mouth', {
	schema: {
		userId: { type: 'string', default: '' }
	},
	unit: null as Unit | null,
	avatar: null as Entity | null,
	head: null as SkinnedMesh | null,
	init: function () {
		if (this.el.parentNode == null) return console.error('parent node is null');
		this.avatar = this.el.parentNode.querySelector('a-gltf-model');
		//traverse the gltf model to find the head
		if (!this.avatar) return console.error('avatar is null');
		this.avatar.addEventListener('model-loaded', () => {
			this.findMouth();
		});
		this.unit = Users.find(this.data.userId) || null;
	},
	tick: function () {
		//get the audio level from the analyser node
		//    this.unit.audioLevel
		//open mouth when audio level is more than 5
		if (!this.head) {
			this.findMouth();
			return;
		}
		if (!this.unit || !this.avatar) return console.error('unit or avatar is null');
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
	},
	findMouth: function () {
		if (!this.avatar) return console.error('avatar is null');
		this.head = findNode(this.avatar.object3D, 'Wolf3D_Avatar');
	}
});

AFRAME.registerComponent('smile', {
	head: null as SkinnedMesh | null,
	init: function () {
		//traverse the gltf model to find the head
		this.el.addEventListener('model-loaded', () => {
			this.head = findNode(this.el.object3D, 'Wolf3D_Avatar');
			if (!this.head) return console.error('head is null');
			setValue(this.head, 'mouthSmile', 0.7);
		});
	}
});
const setValue = (head: SkinnedMesh, key: string, val: number) => {
	if (!head.morphTargetDictionary || !head.morphTargetInfluences)
		return console.error('morph target not found');
	var index = head.morphTargetDictionary[key];
	head.morphTargetInfluences[index] = val;
};
const findNode = (model: Object3D, name: string) => {
	//traverse through model
	let match = null;
	model.traverse((child) => {
		if (child.name == name) {
			match = child;
		}
	});
	return match;
};
