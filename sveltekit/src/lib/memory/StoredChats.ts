import { ChatMessageHistory } from 'langchain/memory';
import type {
	ConversationalRetrievalQAChain,
	loadQAStuffChain,
	ConversationChain
} from 'langchain/chains';
import { db } from '$lib/backend/db';
import type { Event } from '$lib/frontend/Classes/Event';
import type { Mentor } from '$lib/types/Mentor';
import type { Document } from 'langchain/document';
import type { DocumentForAI } from '$lib/types/DocumentForAI';
import { loadDocument } from '$lib/backend/loadDocument';

type StoredChat = {
	mentorId?: string;
	eventId?: string;
	chain: ConversationalRetrievalQAChain | null;
};

class StoredChats extends Array {
	constructor() {
		super();
		//this.initialize();
	}

	findStoredChatAndEvent = async (
		eventId: string
	): Promise<{ storedChat: StoredChat | false; event: Event | false }> => {
		const event = (await db.query(`select * from events where id='${eventId}'`))[0];
		//if (!event) return { storedChat: false, event: false };
		//check if chat is already stored
		let storedChat = storedChats.find((storedChat) => storedChat.eventId === eventId);
		if (!storedChat) {
			//create new chat
			storedChat = {
				eventId: eventId,
				chatHistory: new ChatMessageHistory([]),
				chain: null,
				docs: null
			};
			storedChats.push(storedChat);
		}
		return { storedChat, event };
	};
	findStoredChatAndMentor = async (
		mentorId: string,
		eventId: string
	): Promise<{ storedChat: StoredChat | false; mentor: Mentor | false; event: Event | false }> => {
		const event = (await db.query(`select * from events where id='${eventId}'`))[0];
		const mentor = (await db.query(`select * from mentors where id='${mentorId}'`))[0];
		if (!mentor) return { storedChat: false, mentor: false, event: false };
		//check if chat is already stored
		let storedChat = storedChats.find(
			(storedChat) => storedChat.mentorId === mentorId && storedChat.eventId === eventId
		);
		if (!storedChat) {
			//create new chat
			// storedChat = {
			// 	mentorId: mentorId,
			// 	eventId: eventId,
			// 	chatHistory: new ChatMessageHistory([]),
			// 	chain: null,
			// 	docs: null
			// };
			// storedChats.push(storedChat);
		}
		return { storedChat, mentor, event };
	};
	add(storedChat: StoredChat) {
		//filter existing storedChats
		if (
			this.some(
				(storedChat2) =>
					storedChat2.eventId === storedChat.eventId && storedChat2.mentorId === storedChat.mentorId
			)
		) {
			this.splice(
				this.findIndex(
					(storedChat2) =>
						storedChat2.eventId === storedChat.eventId &&
						storedChat2.mentorId === storedChat.mentorId
				),
				1
			);
		}
		this.push(storedChat);
		console.log({ storedChats });
	}
}

export const storedChats = new StoredChats();
