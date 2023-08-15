import type { ConversationalRetrievalQAChain } from 'langchain/chains.js';

export type StoredChat = {
	channelId: string;
	type: 'user' | 'room';
	mentorId: string;
	userId?: string | undefined;
	roomId?: string | undefined;
	chain: ConversationalRetrievalQAChain;
};
