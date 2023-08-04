import axios from 'axios';
import { Message } from './Classes/Message';
import { escapeHTML } from '$lib/math/escapeHTML';
import { actionHistory } from './Classes/ActionHistory';
import type { Mentor } from './Classes/Mentor';

export const sendQuestionToAI = async (
	mentor: Mentor,
	roomId: string = 'none',
	newMessage: Message
) => {
	console.log({ roomId });
	actionHistory.send('sendQuestionToAI', newMessage);
	const response = await axios
		.post('/mentor/' + mentor.id, {
			roomId,
			...newMessage
		})
		.then((res) => res.data);
	console.log({ response });
	const aiMessage = new Message({
		body: response.response || response.text,
		user: mentor.user,
		room: roomId,
		pinned: false
	});
	return aiMessage;
};
