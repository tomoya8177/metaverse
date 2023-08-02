import { ChatMessageHistory } from 'langchain/memory';
import type {
	ConversationalRetrievalQAChain,
	loadQAStuffChain,
	ConversationChain
} from 'langchain/chains';
import { db } from '$lib/backend/db';
import type { Room } from '$lib/frontend/Classes/Room';
import type { Mentor } from '$lib/types/Mentor';
import type { Document } from 'langchain/document';
import type { DocumentForAI } from '$lib/types/DocumentForAI';
import { loadDocument } from '$lib/backend/loadDocument';

type StoredChat = {
	mentorId?: string;
	roomId?: string;
	chain: ConversationalRetrievalQAChain | null;
};

class StoredChats extends Array {
	constructor() {
		super();
		//this.initialize();
	}

	findStoredChatAndEvent = async (
		roomId: string
	): Promise<{ storedChat: StoredChat | false; room: Room | false }> => {
		const event = (await db.query(`select * from rooms where id='${roomId}'`))[0];
		//if (!event) return { storedChat: false, room: false };
		//check if chat is already stored
		let storedChat = storedChats.find((storedChat) => storedChat.roomId === roomId);
		if (!storedChat) {
			//create new chat
			storedChat = {
				roomId: roomId,
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
		roomId: string
	): Promise<{ storedChat: StoredChat | false; mentor: Mentor | false; room: Room | false }> => {
		const event = (await db.query(`select * from rooms where id='${roomId}'`))[0];
		const mentor = (await db.query(`select * from mentors where id='${mentorId}'`))[0];
		if (!mentor) return { storedChat: false, mentor: false, room: false };
		//check if chat is already stored
		let storedChat = storedChats.find(
			(storedChat) => storedChat.mentorId === mentorId && storedChat.roomId === roomId
		);
		if (!storedChat) {
			//create new chat
			// storedChat = {
			// 	mentorId: mentorId,
			// 	roomId: roomId,
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
					storedChat2.roomId === storedChat.roomId && storedChat2.mentorId === storedChat.mentorId
			)
		) {
			this.splice(
				this.findIndex(
					(storedChat2) =>
						storedChat2.roomId === storedChat.roomId && storedChat2.mentorId === storedChat.mentorId
				),
				1
			);
		}
		this.push(storedChat);
		console.log({ storedChats });
	}
}

export const storedChats = new StoredChats();
