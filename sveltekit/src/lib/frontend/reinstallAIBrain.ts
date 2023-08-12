import axios from 'axios';
import type { Room } from './Classes/Room';
import type { DocumentForAI } from '$lib/types/DocumentForAI';
import { _ } from '$lib/i18n';
import type { Mentor } from './Classes/Mentor';

export const reinstallAIBrain = async (mentor: Mentor | undefined): Promise<DocumentForAI[]> => {
	if (!mentor) return [];
	const res = await axios.put('/mentor/' + mentor.id, {
		roomId: 'none',
		refresh: true
	});

	console.log({ res });
	if (res.data.failedDocuments.length) {
		const failedDocuments = res.data.failedDocuments;
		console.log({ failedDocuments });
		alert(_('Failed to load documents:') + failedDocuments.map((doc) => doc.title).join(', '));
	}
	return res.data.succeededDocuments;
};
