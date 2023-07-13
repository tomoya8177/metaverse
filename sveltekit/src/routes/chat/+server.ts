import { ChatOpenAI } from 'langchain/chat_models/openai';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';
import { OPENAI_API_KEY } from '$env/static/private';
import axios from 'axios';
import { db } from '$lib/backend/db.js';
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse.js';
import { Room, connect, createLocalAudioTrack, LocalAudioTrack } from 'twilio-video';

export const POST = async ({ request }) => {
	const body = await request.json();
	const chat = new ChatOpenAI({ openAIApiKey: OPENAI_API_KEY, modelName: 'gpt-3.5-turbo' });
	// Pass in a list of messages to `call` to start a conversation. In this simple example, we only pass in one message.
	// const responseA = await chat.call([
	// 	new HumanMessage('What is a good name for a company that makes colorful socks?')
	// ]);
	// console.log(responseA);
	// AIMessage { text: '\n\nRainbow Sox Co.' }

	// You can also pass in multiple messages to start a conversation.
	// The first message is a system message that describes the context of the conversation.
	// The second message is a human message that starts the conversation.
	const users = await db.query(`select * from users where id='${body.user}'`);
	console.log({ users });
	const responseB = await chat.call([
		new SystemMessage(
			'You are a helpful teacher in an elementary school. Student name is ' + users[0].nickname
		),
		new HumanMessage(body.body)
	]);
	console.log(responseB);

	// AIMessage { text: "J'aime programmer." }
	return new Response(JSON.stringify(responseB));

	// Similar to LLMs, you can also use `generate` to generate chat completions for multiple sets of messages.
	const responseC = await chat.generate([
		[
			new SystemMessage('You are a helpful assistant that translates English to French.'),
			new HumanMessage('Translate this sentence from English to French. I love programming.')
		],
		[
			new SystemMessage('You are a helpful assistant that translates English to French.'),
			new HumanMessage(
				'Translate this sentence from English to French. I love artificial intelligence.'
			)
		]
	]);
	console.log(responseC);
};
