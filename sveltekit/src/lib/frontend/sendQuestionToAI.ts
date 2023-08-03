import axios from 'axios';
import { Message } from './Classes/Message';
import { escapeHTML } from '$lib/math/escapeHTML';
import { actionHistory } from './Classes/ActionHistory';

export const sendQuestionToAI = async (
	mentorId: string,
	roomId: string = 'none',
	newMessage: Message
) => {
	console.log({ roomId });
	actionHistory.send('sendQuestionToAI', newMessage);
	const response = await axios
		.post('/mentor/' + mentorId, {
			roomId,
			...newMessage
		})
		.then((res) => res.data);
	console.log({ response });
	const aiMessage = new Message({
		body: escapeHTML(response.response || response.text),
		user: 'Mentor',
		room: roomId,
		pinned: false,
		isTalking: true
	});
	return aiMessage;
};
