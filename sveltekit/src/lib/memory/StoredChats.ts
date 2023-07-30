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

type StoredChat = {
	mentorId?: string;
	eventId?: string;
	chatHistory: ChatMessageHistory;
	chain: ConversationChain | ConversationalRetrievalQAChain | null;
	docs: Document<Record<string, any>>[] | null;
};

class StoredChats extends Array {
	constructor() {
		super();
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
			storedChat = {
				mentorId: mentorId,
				eventId: eventId,
				chatHistory: new ChatMessageHistory([]),
				chain: null,
				docs: null
			};
			storedChats.push(storedChat);
		}
		return { storedChat, mentor, event };
	};
}

export const storedChats = new StoredChats();
