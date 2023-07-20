import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { Document } from 'langchain/document';
import axios from 'axios';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';

export const loadDocument = async (filename: string, type: string): Promise<Document[]> => {
	const url = './static/documentsForAI/' + filename;
	console.log({ url });
	switch (type) {
		case 'text':
			const text = await axios
				.get(`http://localhost:5173/documentsForAI/${filename}`)
				.then((res) => res.data);
			const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
			return await textSplitter.createDocuments([text]);
		case 'docx': {
			const loader = new DocxLoader(url);
			return await loader.loadAndSplit();
		}
		case 'pdf': {
			const loader = new PDFLoader(url, {
				splitPages: false
			});
			return await loader.loadAndSplit();
		}
		case 'csv': {
			const loader = new CSVLoader(url);

			return await loader.loadAndSplit();
		}
	}
	return [];
};
