import { db } from '$lib/backend/db.js';
import { storedChats } from '$lib/memory/StoredChats.js';

import type { User } from '$lib/frontend/Classes/User.js';
import type { DocumentForAI } from '$lib/types/DocumentForAI.js';
import type { UserRole } from '$lib/types/UserRole.js';
import type { Event } from '$lib/frontend/Classes/Event.js';
import { loadDocuments } from '$lib/backend/loadDocuments.js';
import { createVectorStoreModelChain } from '$lib/backend/createVectorStoreModelChain.js';
import { HumanMessage, SystemMessage } from 'langchain/schema';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

//get for AI mentor initialize
export const GET = async ({ params, request }) => {
	const result = 'now no use';
	return new Response(JSON.stringify({ result }));

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
	//const result = await Promise.all(promises).then((res) => res);
	console.log({ promises, result });
	return new Response(JSON.stringify({ result }));
};

//put for loading documents
export const PUT = async ({ request, params }) => {
	console.log({ storedChats });
	const body = await request.json();

	const mentor = (await db.query(`select * from mentors where id='${params.mentorId}'`))[0];
	mentor.userData = (await db.query(`select * from users where id='${mentor.user}'`))[0];
	const organization = (
		await db.query(`select * from organizations where id='${mentor.organization}'`)
	)[0];

	// refresh mentor brain for all events or for specific event, and for non-event chat
	let events = [];
	if (body.eventId) {
		//for a specific event
		events.push((await db.query(`select * from events where id='${body.eventId}'`))[0]);
	} else {
		//for all events
		events = await db.query(`select * from events where mentor='${params.mentorId}'`);
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
	if (body.refresh && !storedChats.some((s) => s.mentorId == mentor.id && s.eventId == 'none')) {
		const storedChat = {
			mentorId: params.mentorId,
			eventId: 'none',
			chain
		};
		console.log('rewriting storedChat for mentor');
		storedChats.add(storedChat);
	}
	console.log({ storedChats });

	const succeededDocumentsMom = succeededDocuments;
	//load event's documents
	const eventLoadPromises = events.map(async (event: Event) => {
		if (
			!body.refresh &&
			storedChats.some((s) => s.mentorId == mentor.id && s.eventId == (event?.id || 'none'))
		)
			return;
		console.log('rewriting storedChat for event');

		const messages = event?.prompt || '';
		const eventPromptDocs = await textSplitter.createDocuments([messages]);

		const documents: DocumentForAI[] = await db.query(
			`select * from documentsForAI where event='${event?.id}'`
		);
		const { failedDocuments, succeededDocuments } = await loadDocuments(documents);
		failedDocumentsMom.push(...failedDocuments);
		const { model, chain } = await createVectorStoreModelChain([
			...promptDocs,
			...eventPromptDocs,
			...succeededDocumentsMom,
			...succeededDocuments
		]);
		const storedChat = {
			mentorId: params.mentorId,
			eventId: event?.id || 'none',
			chain
		};
		storedChats.add(storedChat);
	});
	console.log({ storedChats });

	const res = await Promise.all(eventLoadPromises);
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

	const messages = [
		new SystemMessage(`Following is a message from ${user.nickname}.`),
		new HumanMessage(question)
	];

	const res = await storedChat.chain.call({
		question: question
	});

	/* Return the response */
	return new Response(JSON.stringify(res));
};
