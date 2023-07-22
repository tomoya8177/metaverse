import axios from 'axios';
import { Message } from './Classes/Message';
import { escapeHTML } from '$lib/math/escapeHTML';

export const sendQuestionToAI = async (
	mentorId: string,
	eventId: string | undefined = undefined,
	newMessage: Message
) => {
	console.log({ eventId });
	const response = await axios
		.post('/mentor/' + mentorId, {
			eventId,
			...newMessage
		})
		.then((res) => res.data);
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
