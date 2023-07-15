import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import { ConversationalRetrievalQAChain, loadQAStuffChain } from 'langchain/chains';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';
import { OPENAI_API_KEY } from '$env/static/private';
import { db } from '$lib/backend/db.js';
import { unescapeHTML } from '$lib/math/escapeHTML.js';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import * as fs from 'fs';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import axios from 'axios';
import { OpenAI } from 'langchain/llms/openai';
import type { Document } from 'langchain/document';
import { loadDocument } from '$lib/backend/loadDocument.js';
import type { User } from '$lib/types/User.js';
import type { Message } from '$lib/frontend/Classes/Message.js';
import type { DocumentForAI } from '$lib/types/DocumentForAI.js';

const storedChats: {
	eventId: string;
	chatHistory: ChatMessageHistory;
	chain: ConversationalRetrievalQAChain | null;
}[] = [];

//Get for initialising chat

export const GET = async ({ params, request }) => {
	const event = (await db.query(`select * from events where id='${params.eventId}'`))[0];
	if (!event) return new Response(JSON.stringify({ error: 'event not found' }));
	//check if chat is already stored
	let storedChat = storedChats.find((storedChat) => storedChat.eventId === params.eventId);
	let chatHistory: ChatMessageHistory;
	if (!storedChat) {
		//create new chat
		storedChat = {
			eventId: params.eventId,
			chatHistory: new ChatMessageHistory([]),
			chain: null
		};
		storedChats.push(storedChat);
		chatHistory = new ChatMessageHistory([]);
	}
	//create new chat
	const documents = await db.query(`select * from documentsForAI where event='${params.eventId}'`);

	let documentTexts: (string | Document)[] = [];
	let docs: Document[] = [];
	const userRoles: {
		id: string;
		user: string;
		organization: string;
	}[] = await db.query(`select * from userRoles where organization='${event.organization}'`);
	const users: User[] = await db.query(
		`select * from users where id in ('${userRoles.map((userRole) => userRole.user).join("','")}')`
	);
	//load user data as json to docs
	const usersJson = JSON.stringify(users);
	const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
	docs = [...docs, ...(await textSplitter.createDocuments([usersJson]))];
	const Promises: Promise<Document[]>[] = [];
	documents.forEach((document: DocumentForAI) => {
		if (document.type.includes('text')) {
			Promises.push(loadDocument(document.filename, 'text'));
		}
		// for docx files
		if (document.type.includes('docx')) {
			Promises.push(loadDocument(document.filename, 'docx'));
		}
		if (document.type.includes('pdf')) {
			Promises.push(loadDocument(document.filename, 'pdf'));
		}
		if (document.type.includes('csv')) {
			Promises.push(loadDocument(document.filename, 'csv'));
		}
	});
	await Promise.all(Promises).then((res) => {
		res.forEach((d) => {
			docs = [...docs, ...d];
			//documentTexts = [...documentTexts, ...documents];
		});
	});

	const thePrompt = `You are a friendly AI teacher for student users, named ${
		event.virtuaMentorName || 'Nancy'
	}. You may answer questions based on the given context. You can also ask questions to students based on the given context to check if the student understands the context, but do it in a way that does not disclose the answer, and ask one question at a time. When new user says hello, answer hello back and introduce your name. You have users list as json in your memory. You can use it to ask questions to users. please match each users with their nickname.
	${event.virtuaMentorPrompt || ''}}`;
	//get it into the docs
	docs = [...docs, ...(await textSplitter.createDocuments([thePrompt]))];
	const vectorStore = await MemoryVectorStore.fromDocuments(
		docs,
		new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY })
	);

	const model = new ChatOpenAI({ openAIApiKey: OPENAI_API_KEY, modelName: 'gpt-3.5-turbo' });
	storedChat.chain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
		memory: new BufferMemory({ chatHistory: storedChat.chatHistory, memoryKey: 'chat_history' })
	});
	return new Response(JSON.stringify({ storedChat }));
};

//POST for ask question
export const POST = async ({ request, params }) => {
	const body = await request.json();
	const user = (await db.query(`select * from users where id='${body.user}'`))[0];
	let storedChat = storedChats.find((storedChat) => storedChat.eventId === params.eventId);
	const question = `${body.body.replace('@Mentor', '').trim()}`;
	if (!storedChat || !storedChat.chain) {
		return new Response(JSON.stringify({ error: 'event not initialized' }));
	}
	// const res = await chain.call({ question, chatHistory: pastMessages });
	//const res = await chain.call({ question });
	const res = await storedChat.chain.call({ question: `I am ${user.nickname}. ${question}` });

	/* Return the response */
	return new Response(JSON.stringify(res));
};
