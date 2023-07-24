import { unescapeHTML } from '$lib/math/escapeHTML';
import type { Unit } from './Classes/Unit';

export const aiSpeaksOut = (message: string, unit: Unit | null = null) => {
	const utterance = new SpeechSynthesisUtterance(unescapeHTML(message));
	speechSynthesis.speak(utterance);
	console.log({ unit });
	if (unit) {
		const interval = setInterval(() => {
			unit.audioLevel = Math.random() * 3 + 5;
		}, 200);
		//clear interval when speech ends
		utterance.onend = () => {
			clearInterval(interval);
			unit.audioLevel = 0;
		};
	}
};
