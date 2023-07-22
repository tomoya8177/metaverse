let recognition;
export const startAudioToText = () => {
	//activate speech detech api
	createRecognition();
	recognition.start();
	console.log({ recognition }, 'started');
	recognition.addEventListener('result', (e) => {
		console.log(e.results);
		const transcript = e.results[0][0].transcript;
		// const transcript = Array.from(e.results)
		// 	.map((result) => result[0])
		// 	.map((result) => result.transcript.replace('at mentor', '@Mentor'))
		// 	.join('');
		newMessageBody = transcript;
		console.log({ transcript });
		// if (e.results[0].isFinal) {
		// 	onMessageSendClicked();
		// 	//reset recognition results
		// 	// onMicClicked();

		// 	// setTimeout(() => {
		// 	// 	onMicClicked();
		// 	// }, 1000);
		// }
	});
	recognition.onerror = (event) => {
		if (event.error === 'not-allowed') {
			alert('Microphone access denied by the user.');
			// Perform any necessary actions when access is denied
		} else {
			console.log('Error', event.error);
			alert(event.error);
			return;
		}
		onMicClicked();
	};
};

const createRecognition = () => {
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	recognition = new SpeechRecognition();
	recognition.interimResults = true;
	recognition.continuous = true;
	//Setting interimResults to true
};
