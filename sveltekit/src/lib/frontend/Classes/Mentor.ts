import axios from 'axios';
import { DBObject } from './DBObject';
import { User } from './User';
import type { xyz } from '$lib/store';
import { Users } from './Users';
import { DocumentForAI } from '$lib/types/DocumentForAI';
import { _ } from '$lib/i18n';
import type { Unit } from './Unit';
import type { Entity } from 'aframe';
import { degree2radian } from '$lib/math/degree2radians';
import { videoChat } from './VideoChat';

export class Mentor extends DBObject {
	user: string;
	userData: User = new User({});
	voiceURI: string = '';
	utterance: SpeechSynthesisUtterance | null = null;
	speechInterval: any;
	documents: DocumentForAI[] = [];
	organization: string = '';
	prompt: string = '';
	toSpeak: boolean = true;
	el: Entity | null = null;
	position?: xyz = { x: 0, y: 0, z: 3 };
	constructor(data: any) {
		data.table = 'mentors';
		super(data);
		this.user = data.user || '';
		this.voiceURI = data.voiceURI;
		this.organization = data.organization || '';
		this.utterance = new SpeechSynthesisUtterance();
		this.prompt = data.prompt || '';
		const synth = window.speechSynthesis;
		synth.addEventListener('voiceschanged', () => {
			if (this.voiceURI && this.utterance) {
				this.utterance.voice =
					synth.getVoices().find((voice) => {
						return voice.voiceURI == this.voiceURI;
					}) || null;
			}
		});
	}
	setEl() {
		this.el = (document.getElementById(this.userData.id) as Entity) || null;
		console.log({ el: this.el });
	}
	async init() {
		this.userData = await axios.get('/api/users/' + this.user).then((res) => {
			return new User(res.data || {});
		});
		this.documents = await axios
			.get('/api/documentsForAI?mentor=' + this.id)
			.then((res) => res.data.map((doc) => new DocumentForAI(doc)));
	}
	speak(message: string) {
		const unit = Users.find(this.user) as Unit | false;
		if (!this.toSpeak) {
			if (!unit) return;
			unit.audioLevel = 0;
			return;
		}
		if (!this.utterance) return console.error('Mentor.utterance is null');
		this.utterance.text = message;
		speechSynthesis.speak(this.utterance);
		this.speechInterval = setInterval(() => {
			if (!this.toSpeak) {
				clearInterval(this.speechInterval);
				if (!unit) return;

				unit.audioLevel = 0;
				return;
			}
			if (!unit) return;

			unit.audioLevel = Math.random() * 3 + 5;
		}, 200);
		//clear interval when speech ends
		this.utterance.onend = () => {
			clearInterval(this.speechInterval);
			if (!unit) return;

			unit.audioLevel = 0;
		};
	}
	come = async (unit: Unit): Promise<void> => {
		console.log('come', this.el);
		if (!this.el) return;
		const vector = new THREE.Vector3(0, 0, -1.2);
		vector.applyAxisAngle(
			new THREE.Vector3(0, 1, 0),
			degree2radian(unit.el.getAttribute('rotation').y + 30)
		);

		const targetPosition = {
			x: unit.el.object3D.position.x + vector.x,
			y: unit.el.object3D.position.y,
			z: unit.el.object3D.position.z + vector.z
		};
		const targetRotation = {
			x: 0,
			y: unit.el.getAttribute('rotation').y + 210,
			z: 0
		};
		this.go({ targetPosition, targetRotation });
		console.log({ targetPosition });
		videoChat.sendMessage({
			key: 'moveMentor',
			position: targetPosition,
			rotation: targetRotation
		});
	};
	go({ targetPosition, targetRotation }: { targetPosition: xyz; targetRotation: xyz }) {
		if (!this.el) return;
		this.el.setAttribute('animation', {
			property: 'position',
			to: `${targetPosition.x} ${targetPosition.y} ${targetPosition.z}`,
			dur: 2000,
			easing: 'easeInOutQuad'
		});
		this.el.setAttribute('animation__rotation', {
			property: 'rotation',
			to: `${targetRotation.x} ${targetRotation.y} ${targetRotation.z}`,
			dur: 2000,
			easing: 'easeInOutQuad'
		});
	}

	async resetBrain() {
		await axios.post('/mentor/' + this.id + '/reset');
	}
}
