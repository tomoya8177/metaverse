import { db } from '$lib/backend/db.js';
import { storedChats } from '$lib/memory/StoredChats.js';

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferMemory } from 'langchain/memory';
import { ConversationalRetrievalQAChain, ConversationChain } from 'langchain/chains';
import { OPENAI_API_KEY } from '$env/static/private';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { Document } from 'langchain/document';
import { loadDocument } from '$lib/backend/loadDocument.js';
import type { User } from '$lib/frontend/Classes/User.js';
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
	const events = (await db.query(
		`select * from events where mentor='${params.mentorId}'`
	)) as Event[];
	const promises = events.map(async (event) => {
		const { storedChat, mentor } = await storedChats.findStoredChatAndMentor(
			params.mentorId,
			event.id
		);
		return { storedChat, mentor, event };
	});
	const result = await Promise.all(promises).then((res) => res);
	console.log({ promises, result });
	return new Response(JSON.stringify({ result }));
};

//put for loading documents
export const PUT = async ({ request, params }) => {
	const body = await request.json();

	const { storedChat, mentor } = await storedChats.findStoredChatAndMentor(
		params.mentorId,
		body.eventId
	);
	console.log({ storedChat, mentor });
	if (!mentor) return new Response(JSON.stringify({ error: 'mentor not found' }), { status: 404 });
	const user = (await db.query(`select * from users where id='${mentor.user}'`))[0];
	mentor.userData = user;
	const documents = [
		...(await db.query(`select * from documentsForAI where mentor='${params.mentorId}'`)),

		...(body.eventId
			? await db.query(`select * from documentsForAI where event='${body.eventId}'`)
			: [])
	];

	console.log({ documents });

	const userRoles: UserRole[] = await db.query(
		`select * from userRoles where organization='${mentor.organization}'`
	);
	const users: User[] = await db.query(
		`select * from users where id in ('${userRoles.map((userRole) => userRole.user).join("','")}')`
	);
	//load user data as json to docs
	const usersJson = JSON.stringify(users);
	const failedLogs: DocumentForAI[] = [];
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

		const Promises: Promise<Document[] | false>[] = [];

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
			res.forEach((d, i) => {
				if (!d) {
					const failedDocument = documents[i];
					console.log({ failedDocument });
					failedLogs.push(failedDocument);
					return;
				}
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
	return new Response(JSON.stringify({ storedChat, failedLogs }));
};

//post for chat
//POST for ask question
export const POST = async ({ request, params }) => {
	console.log({ params });
	const body = await request.json();
	const user = (await db.query(`select * from users where id='${body.user}'`))[0];
	console.log({ storedChats });
	let storedChat = storedChats.find((storedChat) => {
		if (body.eventId) {
			return storedChat.mentorId === params.mentorId && storedChat.eventId === body.eventId;
		} else {
			console.log(typeof storedChat.eventId, storedChat.mentorId, params.mentorId);
			return storedChat.mentorId == params.mentorId && typeof storedChat.eventId == 'undefined';
		}
	});
	console.log({ storedChat });
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
