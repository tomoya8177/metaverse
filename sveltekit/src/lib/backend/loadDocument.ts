import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { Document } from 'langchain/document';
import axios from 'axios';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import type { DocumentForAI } from '$lib/types/DocumentForAI';

export const loadDocument = async (
	document: DocumentForAI,
	type: string
): Promise<Document[] | false> => {
	console.log('fetching filedata');

	const localFilePath = './userFiles/documentsForAI/' + document.filename; // Adjust the path as needed

	//await saveFileLocally(file.handle, localFilePath);
	try {
		switch (type) {
			case 'text':
				const text = await axios.get(localFilePath).then((res) => res.data);
				const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
				return await textSplitter.createDocuments([text]);
			case 'docx': {
				const loader = new DocxLoader(localFilePath);
				return await loader.loadAndSplit();
			}
			case 'pdf': {
				const loader = new PDFLoader(localFilePath, {
					splitPages: false
				});
				console.log('PDF loaded');
				return await loader.loadAndSplit();
			}
			case 'csv': {
				const loader = new CSVLoader(localFilePath);

				return await loader.loadAndSplit();
			}
		}
		return [];
	} catch (e) {
		console.log({ e });
		return false;
	}
};
