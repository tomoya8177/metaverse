import type { Mentor } from '$lib/types/Mentor';
import axios from 'axios';
import type { Room } from './Classes/Room';
import type { DocumentForAI } from '$lib/types/DocumentForAI';
import { _ } from '$lib/i18n';

export const reinstallAIBrain = async (mentor: Mentor | undefined) => {
	if (!mentor) return;
	const res = await axios.put('/mentor/' + mentor.id, {
		roomId: 'none',
		refresh: true
	});

	console.log({ res });
	if (res.data.failedDocuments.length) {
		const failedDocuments = res.data.failedDocuments;
		console.log({ failedDocuments });
		alert(
			_('Failed to load documents:') +
				failedDocuments.map((docs) => docs.map((doc) => doc.title)).join(', ')
		);
	}
};
