import axios from 'axios';
import { Message } from './Classes/Message';
import { escapeHTML } from '$lib/math/escapeHTML';

export const sendQuestionToAI = async (eventId: string, newMessage: Message) => {
	const response = await axios.post('/chat/' + eventId, newMessage).then((res) => res.data);
	console.log(response);
	const aiMessage = new Message({
		body: escapeHTML(response.response || response.text),
		user: 'Mentor',
		event: eventId,
		pinned: false,
		isTalking: true
	});
	return aiMessage;
};
