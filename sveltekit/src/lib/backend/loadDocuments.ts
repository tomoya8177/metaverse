import type { DocumentForAI } from '$lib/types/DocumentForAI';
import type { Document } from 'langchain/document';
import { loadDocument } from './loadDocument';

export const loadDocuments = async (documents: DocumentForAI[]) => {
	const promises = documents.map((document: DocumentForAI) => {
		if (document.type.includes('text')) {
			return loadDocument(document, 'text');
		}
		// for docx files
		if (document.type.includes('docx') || document.type.includes('officedocument')) {
			return loadDocument(document, 'docx');
		}
		if (document.type.includes('pdf')) {
			return loadDocument(document, 'pdf');
		}
		if (document.type.includes('csv')) {
			return loadDocument(document, 'csv');
		}
	});
	const res = await Promise.all(promises);
	let failedDocuments: DocumentForAI[] = [];
	let succeededDocuments: Document[] = [];
	res.forEach((d, i) => {
		if (!d) {
			const failedDocument = documents[i];
			console.log({ failedDocument });
			failedDocuments.push(failedDocument);
			return;
		}
		succeededDocuments.push(...d);
	});
	return { failedDocuments, succeededDocuments };
};
