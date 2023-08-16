import { OPENAI_API_KEY } from '$env/static/private';
import { storedChats } from '$lib/memory/StoredChats.js';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';
import { Configuration, OpenAIApi } from 'openai';
import { Body } from 'twilio/lib/twiml/MessagingResponse.js';
const configuration = new Configuration({
	apiKey: OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);
export const POST = async ({ request }) => {
	const body = await request.json();
	try {
		const chat_completion = await openai.createChatCompletion({
			model: 'gpt-4',
			messages: body.messages,
			temperature: 0.6
		});
		console.log(body.messages);
		// if (body.appendToChannel) {
		//append to channel
		// const storedChat = storedChats.find(
		// 	(storedChat) => storedChat.roomId == body.appendToChannel
		// );
		// if (storedChat) {
		// storedChat.chatHistory.push(
		// 	...body.messages.map((message) => {
		// 		if (message.role == 'system') return new SystemMessage(message.content);
		// 		else return new HumanMessage(message.content);
		// 	})
		// );
		// storedChat.chatHistory.push(
		// 	new AIMessage(chat_completion.data.choices[0].message?.content || '')
		// );
		// console.log('pushed', storedChat.chatHistory);
		// }
		// }
		return new Response(JSON.stringify({ response: chat_completion.data.choices[0].message }));
	} catch (error) {
		console.log(error);
		return new Response(JSON.stringify({ response: `AI is busy right now` }));
	}
};

export const GET = async () => {
	//initialize all mentors
};
