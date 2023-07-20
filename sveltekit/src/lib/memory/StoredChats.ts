import { ChatMessageHistory } from 'langchain/memory';
import type { ConversationalRetrievalQAChain, loadQAStuffChain } from 'langchain/chains';
import { db } from '$lib/backend/db';
import type { Event } from '$lib/frontend/Classes/Event';

class StoredChats extends Array {
	constructor() {
		super();
	}
	findStoredChatAndEvent = async (
		eventId: string
	): Promise<{ storedChat: typeof storedChat; event: Event | false }> => {
		const event = (await db.query(`select * from events where id='${eventId}'`))[0];
		if (!event) return { storedChat: false, event: false };
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
		mentorId: string
	): Promise<{ storedChat: typeof storedChat; mentor: typeof mentor }> => {
		const mentor = (await db.query(`select * from mentors where id='${mentorId}'`))[0];
		if (!mentor) return { storedChat: false, mentor: false };
		//check if chat is already stored
		let storedChat = storedChats.find((storedChat) => storedChat.mentorId === mentorId);
		if (!storedChat) {
			//create new chat
			storedChat = {
				mentorId: mentorId,
				chatHistory: new ChatMessageHistory([]),
				chain: null,
				docs: null
			};
			storedChats.push(storedChat);
		}
		return { storedChat, mentor };
	};
}

export const storedChats = new StoredChats();
