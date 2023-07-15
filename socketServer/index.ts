import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import fs from 'fs';
import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import { DateTime } from 'luxon';
import { API_ENDPOINT, openAIApiKey } from './lib/config';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { Document } from 'langchain/document';
import { DocumentForAI } from './lib/DocumentForAI';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { User } from './lib/User';
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://mymetaverseportal.net'],
  },
});

const storedConversations: {
  eventId: string;
  chatHistory: ChatMessageHistory;
}[] = [];

// serve static files in documentsForAI folder
app.use('/documentsForAI', express.static('documentsForAI'));

// Handle socket connection
const loadDocument = async (filename: string, type: string): Promise<Document[]> => {
  const url = './documentsForAI/' + filename;
  switch (type) {
    case 'text':
      const text = await axios.get(`http://localhost:3000/documentsForAI/${filename}`).then((res) => res.data);
      const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
      return await textSplitter.createDocuments([text]);
    case 'docx': {
      const loader = new DocxLoader(url);
      return await loader.loadAndSplit();
    }
    case 'pdf': {
      const loader = new PDFLoader(url, {
        splitPages: false,
      });
      return await loader.loadAndSplit();
    }
  }
  return [];
};

io.on('connection', (socket) => {
  console.log('User connected');
  let chain: ConversationalRetrievalQAChain;
  let chatHistory: ChatMessageHistory;
  let model: ChatOpenAI;
  let vectorStore: MemoryVectorStore;
  let user: User | null;
  const createNewChain = async () => {
    try {
      socket.on('setEventId', async (data) => {
        const event = await axios.get(API_ENDPOINT + '/api/events/' + data.eventId).then((res) => res.data);
        const documents = await axios.get(API_ENDPOINT + '/api/documentsForAI?event=' + event.id).then((res) => res.data);
        console.log({ documents });
        let documentTexts: (string | Document)[] = [];
        let docs: Document[] = [];
        const Promises: Promise<Document[]>[] = [];
        documents.forEach((document: DocumentForAI) => {
          if (document.type.includes('text')) {
            Promises.push(loadDocument(document.filename, 'text'));
          }
          // for docx files
          if (document.type.includes('docx')) {
            Promises.push(loadDocument(document.filename, 'docx'));
          }
        });
        console.log({ Promises });
        await Promise.all(Promises).then((res) => {
          console.log({ res });
          res.forEach((d) => {
            docs = [...docs, ...d];
            //documentTexts = [...documentTexts, ...documents];
          });
        });
        console.log({ docs });

        //load users
        const userRoles: {
          id: string;
          user: string;
          organization: string;
        }[] = await axios.get(API_ENDPOINT + '/api/userRoles?organization=' + event.organization).then((res) => res.data);
        console.log({ userRoles });
        const users: User[] = await axios.get(API_ENDPOINT + `/api/users?id=in:'${userRoles.map((userRole) => userRole.user).join("','")}'`).then((res) => res.data);
        console.log({ users });
        //load user data as json to docs
        const usersJson = JSON.stringify(users);
        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
        docs = [...docs, ...(await textSplitter.createDocuments([usersJson]))];

        // const loader = new DocxLoader('./documentsForAI/aboutTomoyaImai.docx');
        // docs = [...docs, ...(await loader.loadAndSplit())];
        model = new ChatOpenAI({ openAIApiKey: openAIApiKey, modelName: 'gpt-3.5-turbo', temperature: 0.9 });
        documentTexts.push(
          `You are a friendly AI teacher for student users, named ${
            event.virtuaMentorName || 'Namcy'
          }. You may answer questions based on the given context. You can also ask questions to students based on the given context to check if the student understands the context, but do it in a way that does not disclose the answer, and ask one question at a time. When new user says hello, answer hello back and introduce your name. You have users list as json in your memory. You can use it to ask questions to users. please match each users with their nickname.`
        );
        if (event.prompt) {
          documentTexts.push(event.prompt);
        }

        //const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });

        //const docs = await textSplitter.createDocuments(documentTexts);
        //const docs = await textSplitter.createDocuments(docx);

        vectorStore = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings({ openAIApiKey: openAIApiKey }));

        const conversation = storedConversations.find((conversation) => conversation.eventId === data.eventId);

        console.log(conversation);
        if (conversation) {
          chatHistory = conversation.chatHistory;
        } else {
          // chatHistory = new ChatMessageHistory([new AIMessage('Welcome to the quiz! My name is Nancy, and I am going to give you some quizes based on the given context.')]);
          chatHistory = new ChatMessageHistory([]);
          storedConversations.push({
            eventId: data.eventId,
            chatHistory,
          });
        }
        console.log({ chatHistory });

        // Create the chain with the LLM, vector store, and chat history
        chain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
          memory: new BufferMemory({ chatHistory, memoryKey: 'chat_history' }),
        });

        //ai asks first question
        // user = users.find((user) => user.id === data.userId) || null;
        // console.log({ user });
        // const response = await chain.call({ question: `Hello! my nickname is ${user?.nickname}` });
        // const answer = response.text;
        // //chatHistory.addMessage(new AIMessage(answer));
        // console.log({ chatHistory });
        // socket.emit('answer', answer);
      });

      // Listen for user questions
      socket.on('statement', async (statement) => {
        try {
          //just add the statement to the chat history
          chatHistory.addMessage(new HumanMessage(statement));
          chain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
            memory: new BufferMemory({ chatHistory, memoryKey: 'chat_history' }),
          });
          console.log({ chatHistory });
        } catch (error) {
          console.error('Error in processing statement:', error);
        }
      });
      socket.on('question', async (question) => {
        try {
          // Process the user question and get the response from the chain
          console.log({ chatHistory });
          const response = await chain.call({ question: `I am ${user?.nickname}. ${question}` });

          // Get the answer from the response
          console.log({ response });
          const answer = response.text;
          //chatHistory.addMessage(new HumanMessage(question));
          //chatHistory.addMessage(new AIMessage(answer));

          // Send the answer back to the user
          socket.emit('answer', answer);
        } catch (error) {
          console.error('Error in processing question:', error);
        }
      });
    } catch (error) {
      console.error('Error in creating chain:', error);
    }
  };

  // Create a new chain for the connected user
  createNewChain();

  // Handle socket disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the Socket.IO server

server.listen(3000, () => {
  console.log('listening on *:3000');
});
