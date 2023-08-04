import { OPENAI_API_KEY } from '$env/static/private';
import { storedChats } from '$lib/memory/StoredChats.js';
import { Configuration, OpenAIApi } from 'openai';
import { Body } from 'twilio/lib/twiml/MessagingResponse.js';
const configuration = new Configuration({
	apiKey: OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);
export const POST = async ({ request }) => {
	const body = await request.json();
	const chat_completion = await openai.createChatCompletion({
		model: 'gpt-3.5-turbo',
		messages: body.messages,
		temperature: 0.6
	});
	console.log(body.messages);
	return new Response(JSON.stringify({ response: chat_completion.data.choices[0].message }));
};

export const GET = async () => {
	//initialize all mentors
};
