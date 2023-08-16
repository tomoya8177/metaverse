import { port } from '$env/static/private';
import { createVectorStoreModelChain } from '$lib/backend/createVectorStoreModelChain.js';
import { db } from '$lib/backend/db.js';
import { loadDocuments } from '$lib/backend/loadDocuments.js';
import type { Room } from '$lib/frontend/Classes/Room.js';
import type { User } from '$lib/frontend/Classes/User.js';
import { storedChats } from '$lib/memory/StoredChats.js';
import type { DocumentForAI } from '$lib/types/DocumentForAI.js';
import type { StoredChat } from '$lib/types/StoredChat';
import type { UserRole } from '$lib/types/UserRole.js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const POST = async ({ request, params }) => {
	//POST for question
	const body: {
		type: 'user' | 'room';
		roomId: string | undefined;
		userId: string | undefined;
		body: string;
	} = await request.json();
	console.log({ body });
	console.log({ storedChats });
	let storedChat = storedChats.find((storedChat) => {
		return storedChat.channelId == params.channelId;
	});
	console.log({ storedChat });
	if (!storedChat || !storedChat.chain) {
		console.log('no chain yet');
		storedChat = await studyChannel({
			channelId: params.channelId,
			mentorId: params.mentorId,
			type: body.type,
			roomId: body.roomId,
			userId: body.userId
		});
	}
	const question = `${body.body.replace('@Mentor', '').trim()}`;

	const res = await storedChat.chain.call({
		question
	});

	/* Return the response */
	return new Response(JSON.stringify(res));
};

const studyChannel = async (data: {
	channelId: string;
	mentorId: string;
	type: 'room' | 'user';
	roomId: string | undefined;
	userId: string | undefined;
}) => {
	console.log('studying', data);
	const mentor = (await db.query(`select * from mentors where id='${data.mentorId}'`))[0];
	mentor.userData = (await db.query(`select * from users where id='${mentor.user}'`))[0];

	const organization = (
		await db.query(`select * from organizations where id='${mentor.organization}'`)
	)[0];
	const manualData = await fetch('http://localhost:' + port + '/virtuacampusManual.json').then(
		(res) => res.json()
	);
	const filteredManual = {
		title: manualData.name,
		cards: manualData.cards.map((card) => {
			return {
				name: card.name,
				content: card.desc
			};
		})
	};
	const manualJson = JSON.stringify(filteredManual);
	const documents: DocumentForAI[] = await db.query(
		`select * from documentsForAI where mentor='${data.mentorId}'`
	);
	let message =
		`You are a helpful and talkative AI mentor named ${mentor.userData.nickname} at an organization called ${organization.title}. ${mentor.prompt}. When a user asks a question, you'll answer it based on the given context, but don't give away any extra information from the context when the question is not related to the context. You can answer questions using your knowledge and be creative. You can also ask questions to the user to get more information. When user is only greeting, you should simply greet back.

		Do not disclose any id string, including user id, event id, object id etc.
  
  Following is a manual for using this platform called VirtuaCampus. Reference these data when answering questions about the system itself.` +
		manualJson;
	const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });

	if (data.type == 'user') {
		const user = (await db.query(`select * from users where id='${data.userId}'`))[0];
		const attendances = await db.query(`select * from attendances where user='${data.userId}'`);
		const q = `select * from events where id in ('${attendances
			.map((attendance) => attendance.event)
			.join("','")}') and start>='${new Date().toISOString()}'`;
		console.log({ q });
		const rows = await db.query(q);
		const events = rows.map((event) => {
			event.attendance = attendances.find((attendance) => attendance.event == event.id);
			return event;
		});
		message += `You are having a 1-on-1 conversation with a user.

      Following is the information of the user:
      ${JSON.stringify(user)}

      Following is the information of the events the user may attend:
      ${JSON.stringify(events)}
      
      Following is a context you should know when you answer user's questions:
    `;
		console.log({ message });
		console.log({ events });
		const promptDocs = await textSplitter.createDocuments([message]);

		const { failedDocuments, succeededDocuments } = await loadDocuments(documents);
		const { model, chain } = await createVectorStoreModelChain([
			...promptDocs,
			...succeededDocuments
		]);
		const storedChat: StoredChat = {
			channelId: data.channelId,
			mentorId: data.mentorId,
			roomId: 'none',
			type: 'user',
			userId: data.userId,
			chain
		};
		storedChats.push(storedChat);
		return storedChat;
	} else if (data.type == 'room') {
		const room = (await db.query(`select * from rooms where id='${data.roomId}'`))[0];
		const objectRows = await db.query(`select * from objects where room='${data.roomId}'`);
		const rows = await db.query(
			`select * from events where object in ('${objectRows
				.map((object) => object.id)
				.join("','")}') and start>='${new Date().toISOString()}'`
		);
		const attendances = await db.query(
			`select * from attendances where event in ('${rows.map((row) => row.id).join("','")}')`
		);
		const events = rows.map((event) => {
			event.attendancea = attendances.filter((attendance) => attendance.event == event.id);
			return event;
		});
		console.log({ events });
		const objects = objectRows.map((object) => {
			object.event = events.find((event) => event.object == object.id);
			return object;
		});
		message += `You are in a virtual room with multiple users. The room is named ${room.title}. ${room.prompt}.`;
		if (objects.length > 0) {
			message += `Following is the information of the objects in the room:
      ${JSON.stringify(objects)}
      `;
		}
		const roomPromptDocs = await textSplitter.createDocuments([message]);
		const roomDocuments: DocumentForAI[] = await db.query(
			`select * from documentsForAI where room='${room?.id}'`
		);
		const { failedDocuments, succeededDocuments } = await loadDocuments([
			...documents,
			...roomDocuments
		]);
		failedDocuments.push(...failedDocuments);
		const { model, chain } = await createVectorStoreModelChain([
			...roomPromptDocs,
			...succeededDocuments
		]);
		const storedChat: StoredChat = {
			mentorId: data.mentorId,
			roomId: data.roomId,
			chain,
			type: 'room',
			channelId: data.channelId
		};
		storedChats.push(storedChat);
		return storedChat;
	}
};
