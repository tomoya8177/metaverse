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
	resetMentor(mentorId: string) {
		this.splice(
			this.findIndex((storedChat) => {
				return storedChat.mentorId != mentorId;
			}),
			1
		);
	}
}

export const storedChats = new StoredChats();
