import { unescapeHTML } from '$lib/math/escapeHTML';
import { AISpeaks } from '$lib/store';
import type { Unit } from './Classes/Unit';

export let speechInterval;
let aiSpeaks = false;
AISpeaks.subscribe((value) => {
	aiSpeaks = value;
});

export const aiSpeaksOut = (message: string, unit: Unit | null = null) => {
	const utterance = new SpeechSynthesisUtterance(unescapeHTML(message));
	const voices = speechSynthesis.getVoices();
	console.log({ voices });
	utterance.voice = voices[(Math.random() * voices.length) | 0];
	speechSynthesis.speak(utterance);
	console.log({ unit });
	if (unit) {
		speechInterval = setInterval(() => {
			if (!aiSpeaks) {
				clearInterval(speechInterval);
				unit.audioLevel = 0;
				return;
			}
			unit.audioLevel = Math.random() * 3 + 5;
		}, 200);
		//clear interval when speech ends
		utterance.onend = () => {
			clearInterval(speechInterval);
			unit.audioLevel = 0;
		};
	}
};
