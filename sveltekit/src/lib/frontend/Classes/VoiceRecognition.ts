export class VoiceRecognition {
	recognition: SpeechRecognition;
	body: string;
	constructor(onError: () => void) {
		this.body = '';
		//activate speech detech api
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		this.recognition = new SpeechRecognition();
		this.recognition.interimResults = true;
		this.recognition.continuous = true;
		this.recognition.start();
		this.recognition.addEventListener('result', (e) => {
			console.log(e.results);
			const transcript = e.results[0][0].transcript;

			this.body = transcript;
			console.log({ transcript });
		});
		this.recognition.onerror = onError;
	}
	stop() {
		this.recognition.stop();
	}
}
