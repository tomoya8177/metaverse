import { OPENAI_API_KEY } from '$env/static/private';
import type { DocumentForAI } from '$lib/types/DocumentForAI';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import type { BaseMessage } from 'langchain/dist/schema';
import type { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

export const createVectorStoreModelChain = async (documents: Document[]) => {
	const vectorStore = await MemoryVectorStore.fromDocuments(
		documents,
		new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY })
	);
	const chatHistory = new ChatMessageHistory([]);

	const model = new ChatOpenAI({ openAIApiKey: OPENAI_API_KEY, modelName: 'gpt-3.5-turbo' });
	const chain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
		memory: new BufferMemory({ chatHistory: chatHistory, memoryKey: 'chat_history' })
	});
	return { model, chain };
};
