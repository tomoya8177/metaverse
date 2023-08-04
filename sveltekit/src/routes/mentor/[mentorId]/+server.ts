import { db } from '$lib/backend/db.js';
import { storedChats } from '$lib/memory/StoredChats.js';

import type { User } from '$lib/frontend/Classes/User.js';
import type { DocumentForAI } from '$lib/types/DocumentForAI.js';
import type { UserRole } from '$lib/types/UserRole.js';
import type { Room } from '$lib/frontend/Classes/Room.js';
import { loadDocuments } from '$lib/backend/loadDocuments.js';
import { createVectorStoreModelChain } from '$lib/backend/createVectorStoreModelChain.js';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { ConversationalRetrievalQAChain } from 'langchain/chains.js';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import type { System } from 'aframe';

type StoredChat = {
	mentorId: string;
	roomId: string;
	chatHistory: (HumanMessage | SystemMessage | AIMessage)[];
	chain: ConversationalRetrievalQAChain;
};

//get for AI mentor initialize
export const GET = async ({ params, request }) => {
	const result = 'now no use';
	return new Response(JSON.stringify({ result }));
};

//put for loading documents
export const PUT = async ({ request, params }) => {
	const body = await request.json();

	const mentor = (await db.query(`select * from mentors where id='${params.mentorId}'`))[0];
	mentor.userData = (await db.query(`select * from users where id='${mentor.user}'`))[0];
	const organization = (
		await db.query(`select * from organizations where id='${mentor.organization}'`)
	)[0];

	let rooms: Room[] = [];
	if (body.roomId != 'none') {
		rooms.push((await db.query(`select * from rooms where id='${body.roomId}'`))[0]);
	} else {
		//for all rooms
		rooms = await db.query(`select * from rooms where mentor='${params.mentorId}'`);
	}
	//load mentor's documents first
	const documents: DocumentForAI[] = await db.query(
		`select * from documentsForAI where mentor='${params.mentorId}'`
	);
	const { failedDocuments, succeededDocuments } = await loadDocuments(documents);

	//load first prompt

	const failedDocumentsMom = failedDocuments;
	//load users data
	const userRoles: UserRole[] = await db.query(
		`select * from userRoles where organization='${mentor.organization}'`
	);
	const users: User[] = await db.query(
		`select * from users where id in ('${userRoles.map((userRole) => userRole.user).join("','")}')`
	);
	//load user data as json to docs
	const usersJson = JSON.stringify(users);
	const messages =
		`You are a helpful AI mentor named ${mentor.userData.nickname} at an organization called ${organization.title}. ${mentor.prompt}. You'll answer questions based on the given context, but don't give away any extra information from the context when the question is not related to the context. You can answer questions using your knowledge. You can also ask questions to the user to get more information.` +
		`Below is the list of users in the class with some details about each users.` +
		usersJson;
	const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
	const promptDocs = await textSplitter.createDocuments([messages]);
	//store mentor's memory first
	const { model, chain } = await createVectorStoreModelChain([
		...promptDocs,
		...succeededDocuments
	]);
	if (body.refresh && !storedChats.some((s) => s.mentorId == mentor.id && s.roomId == 'none')) {
		const storedChat: StoredChat = {
			mentorId: params.mentorId,
			roomId: 'none',
			chain,
			chatHistory: []
		};
		storedChats.add(storedChat);
	}

	const succeededDocumentsMom = succeededDocuments;
	const roomLoadPromises = rooms.map(async (room: Room) => {
		if (
			!body.refresh &&
			storedChats.some((s) => s.mentorId == mentor.id && s.roomId == (room?.id || 'none'))
		)
			return;

		const messages = room?.prompt || '';
		const roomPromptDocs = await textSplitter.createDocuments([messages]);

		const documents: DocumentForAI[] = await db.query(
			`select * from documentsForAI where room='${room?.id}'`
		);
		const { failedDocuments, succeededDocuments } = await loadDocuments(documents);
		failedDocumentsMom.push(...failedDocuments);
		const { model, chain } = await createVectorStoreModelChain([
			...promptDocs,
			...roomPromptDocs,
			...succeededDocumentsMom,
			...succeededDocuments
		]);
		const storedChat: StoredChat = {
			mentorId: params.mentorId,
			roomId: room?.id || 'none',
			chain,
			chatHistory: []
		};
		storedChats.add(storedChat);
	});

	await Promise.all(roomLoadPromises);
	return new Response(
		JSON.stringify({
			result: 'success',
			storedChats,
			failedDocuments: failedDocumentsMom
		})
	);
};

//post for chat
//POST for ask question
export const POST = async ({ request, params }) => {
	const body = await request.json();
	const user = (await db.query(`select * from users where id='${body.user}'`))[0];
	let storedChat = storedChats.find((storedChat) => {
		if (body.roomId != 'none') {
			return storedChat.mentorId === params.mentorId && storedChat.roomId === body.roomId;
		} else {
			return storedChat.mentorId == params.mentorId && storedChat.roomId == 'none';
		}
	});
	if (!storedChat || !storedChat.chain) {
		return new Response(JSON.stringify({ error: 'mentor not initialized' }));
	}
	if (typeof storedChat.chatHistory == 'undefined') {
		storedChat.chatHistory = [];
	}
	let question = '';
	let messages: (SystemMessage | AIMessage | HumanMessage)[] = [];
	switch (body.action) {
		case 'greet':
			const room = (await db.query(`select * from rooms where id='${body.roomId}'`))[0];
			const organization = (
				await db.query(`select * from organizations where id='${room.organization}'`)
			)[0];
			question = `Hi.`;
			messages = [
				new SystemMessage(
					`The user, whose nickname is ${user.nickname}, just joined the conversation. You should greet the user nicely.`
				)
			];
			break;
		default:
			question = `${body.body.replace('@Mentor', '').trim()}`;

			messages = [
				new SystemMessage(`Following is a message from ${user.nickname}.`),
				new HumanMessage(question)
				//new HumanMessage(question)
			];
	}
	storedChat.chatHistory.push(...messages);

	const res = await storedChat.chain.call({
		question: '',
		chat_history: storedChat.chatHistory.slice(-10)
	});
	storedChat.chatHistory.push(new AIMessage(res.text));

	/* Return the response */
	return new Response(JSON.stringify(res));
};
