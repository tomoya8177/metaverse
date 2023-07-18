import { unescapeHTML } from '$lib/math/escapeHTML';

export const aiSpeaksOut = (message: string) => {
	const utterance = new SpeechSynthesisUtterance(unescapeHTML(message));
	speechSynthesis.speak(utterance);
};
