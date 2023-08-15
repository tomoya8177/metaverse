import axios from 'axios';
import { DBObject } from './DBObject';
import { User } from './User';
import { AISpeaks } from '$lib/store';
import { Users } from './Users';
import { DocumentForAI } from '$lib/types/DocumentForAI';
import { _ } from '$lib/i18n';

let aiSpeaks = false;
AISpeaks.subscribe((value) => {
	aiSpeaks = value;
});

export class Mentor extends DBObject {
	user: string;
	userData: User = new User({});
	voiceURI: string = '';
	utterance: SpeechSynthesisUtterance | null = null;
	speechInterval: any;
	documents: DocumentForAI[] = [];
	organization: string = '';
	constructor(data: any) {
		data.table = 'mentors';
		super(data);
		this.user = data.user || '';
		this.voiceURI = data.voiceURI;
		this.organization = data.organization || '';
		this.utterance = new SpeechSynthesisUtterance();
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
	async init() {
		this.userData = await axios.get('/api/users/' + this.user).then((res) => {
			return new User(res.data || {});
		});
		this.documents = await axios
			.get('/api/documentsForAI?mentor=' + this.id)
			.then((res) => res.data.map((doc) => new DocumentForAI(doc)));
	}
	speak(message: string) {
		const unit = Users.find(this.user);
		if (!this.utterance) return console.error('Mentor.utterance is null');
		this.utterance.text = message;
		speechSynthesis.speak(this.utterance);
		if (!unit) return;
		this.speechInterval = setInterval(() => {
			if (!aiSpeaks) {
				clearInterval(this.speechInterval);
				unit.audioLevel = 0;
				return;
			}
			unit.audioLevel = Math.random() * 3 + 5;
		}, 200);
		//clear interval when speech ends
		this.utterance.onend = () => {
			clearInterval(this.speechInterval);
			unit.audioLevel = 0;
		};
	}
	async study(roomId: string) {
		const res = await axios.put('/mentor/' + this.id, {
			roomId,
			refresh: true
		});

		console.log({ res });
		if (res.data.failedDocuments.length) {
			const failedDocuments = res.data.failedDocuments;
			console.log({ failedDocuments });
			alert(_('Failed to load documents:') + failedDocuments.map((doc) => doc.title).join(', '));
		}
		return res.data.succeededDocuments;
	}
}
