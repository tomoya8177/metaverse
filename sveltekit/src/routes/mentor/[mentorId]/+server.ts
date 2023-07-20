import { db } from '$lib/backend/db.js';
import { storedChats } from '$lib/memory/StoredChats.js';

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import {
	ConversationalRetrievalQAChain,
	ConversationChain,
	loadQAStuffChain
} from 'langchain/chains';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';
import { OPENAI_API_KEY } from '$env/static/private';
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
import type { User } from '$lib/frontend/Classes/User.js';
import type { Message } from '$lib/frontend/Classes/Message.js';
import type { DocumentForAI } from '$lib/types/DocumentForAI.js';
import { virtuaMentorPrompt } from '$lib/preset/VirtuaMentorPrompt.js';
import type { UserRole } from '$lib/types/UserRole.js';
import type { Event } from '$lib/frontend/Classes/Event.js';
import {
	ChatPromptTemplate,
	HumanMessagePromptTemplate,
	MessagesPlaceholder,
	SystemMessagePromptTemplate
} from 'langchain/prompts';

//get for AI mentor initialize
export const GET = async ({ params, request }) => {
	const { storedChat, mentor } = await storedChats.findStoredChatAndMentor(params.mentorId);
	return new Response(JSON.stringify({ storedChat, mentor }));
};

//put for loading documents
export const PUT = async ({ request, params }) => {
	const { storedChat, mentor } = await storedChats.findStoredChatAndMentor(params.mentorId);
	console.log({ storedChat, mentor });
	if (!mentor) return new Response(JSON.stringify({ error: 'mentor not found' }), { status: 404 });
	const user = (await db.query(`select * from users where id='${mentor.user}'`))[0];
	mentor.userData = user;
	const documents = await db.query(
		`select * from documentsForAI where mentor='${params.mentorId}'`
	);
	console.log({ documents });

	const userRoles: UserRole[] = await db.query(
		`select * from userRoles where organization='${mentor.organization}'`
	);
	const users: User[] = await db.query(
		`select * from users where id in ('${userRoles.map((userRole) => userRole.user).join("','")}')`
	);
	//load user data as json to docs
	const usersJson = JSON.stringify(users);
	if (mentor.withDocuments || documents.length > 0) {
		let docs: Document[] = [];
		const thePrompt = virtuaMentorPrompt({
			name: mentor.userData.nickname,
			additionalPrompt: mentor.prompt,
			widhDocumentsForAI: true
		});

		//get it into the docs
		const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
		docs = [
			...docs,
			...(await textSplitter.createDocuments([
				thePrompt,
				`Below is the list of users in the class with some details about each users.`,
				usersJson
			]))
		];
		docs = [
			...docs,
			...(await textSplitter.createDocuments([
				`Following contents are the context of this class. Please answer questions based on this context.`
			]))
		];

		const Promises: Promise<Document[]>[] = [];

		documents.forEach((document: DocumentForAI) => {
			if (document.type.includes('text')) {
				Promises.push(loadDocument(document.filename, 'text'));
			}
			// for docx files
			if (document.type.includes('docx') || document.type.includes('officedocument')) {
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
			});
		});
		storedChat.docs = docs;

		//document is already loaded
		const vectorStore = await MemoryVectorStore.fromDocuments(
			storedChat.docs,
			new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY })
		);

		const model = new ChatOpenAI({ openAIApiKey: OPENAI_API_KEY, modelName: 'gpt-3.5-turbo' });
		storedChat.chain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
			memory: new BufferMemory({ chatHistory: storedChat.chatHistory, memoryKey: 'chat_history' })
		});
	} else {
		//no document. lets create a generic conversation chain
		const model = new ChatOpenAI({ openAIApiKey: OPENAI_API_KEY, modelName: 'gpt-3.5-turbo' });
		let string = `${virtuaMentorPrompt({
			name: mentor.userData.nickname,
			additionalPrompt: mentor.prompt,
			widhDocumentsForAI: false
		})}
		Below is the list of users in the class with some details about each users.
		${usersJson}
		`;
		string = string.replace(/({|})/g, '$&$&');
		const template = SystemMessagePromptTemplate.fromTemplate(string);
		console.log({ template });
		const chatPrompt = ChatPromptTemplate.fromPromptMessages([
			template,
			new MessagesPlaceholder('history'),
			HumanMessagePromptTemplate.fromTemplate('{question}')
		]);
		console.log({ chatPrompt });
		storedChat.chain = new ConversationChain({
			memory: new BufferMemory({ returnMessages: true, memoryKey: 'history' }),
			prompt: chatPrompt,
			llm: model
		});
	}
	return new Response(JSON.stringify({ storedChat }));
};

//post for chat
//POST for ask question
export const POST = async ({ request, params }) => {
	const body = await request.json();
	const user = (await db.query(`select * from users where id='${body.user}'`))[0];
	let storedChat = storedChats.find((storedChat) => storedChat.mentorId === params.mentorId);
	const question = `${body.body.replace('@Mentor', '').trim()}`;
	if (!storedChat || !storedChat.chain) {
		return new Response(JSON.stringify({ error: 'mentor not initialized' }));
	}
	// const res = await chain.call({ question, chatHistory: pastMessages });
	//const res = await chain.call({ question });
	const res = await storedChat.chain.call({ question: `I am ${user.nickname}. ${question}` });

	/* Return the response */
	return new Response(JSON.stringify(res));
};
