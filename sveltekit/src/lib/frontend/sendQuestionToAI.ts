import axios from 'axios';
import { Message } from './Classes/Message';
import { escapeHTML } from '$lib/math/escapeHTML';
import { actionHistory } from './Classes/ActionHistory';
import type { Mentor } from './Classes/Mentor';

export const sendQuestionToAI = async (data: {
	mentor: Mentor;
	roomId: string | undefined;
	userId: string | undefined;
	newMessage: Message;
	type: 'user' | 'room';
	channelId: string;
}) => {
	console.log({ data });
	actionHistory.send('sendQuestionToAI', {
		...data.newMessage.purifyData(),
		body: escapeHTML(data.newMessage.body)
	});
	const response = await axios
		.post('/mentor/' + data.mentor.id + '/' + data.channelId, {
			roomId: data.roomId,
			userId: data.userId,
			type: data.type,
			channelId: data.channelId,
			body: escapeHTML(data.newMessage.body)
		})
		.then((res) => res.data);
	console.log({ response });
	const aiMessage = new Message({
		body: response.response || response.text,
		user: data.mentor.user,
		room: data.roomId,
		pinned: false
	});
	return aiMessage;
};
