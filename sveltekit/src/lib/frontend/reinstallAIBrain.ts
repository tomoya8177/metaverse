import type { Mentor } from '$lib/types/Mentor';
import axios from 'axios';
import type { Event } from './Classes/Event';
import type { DocumentForAI } from '$lib/types/DocumentForAI';
import { _ } from '$lib/i18n';

export const reinstallAIBrain = async (mentor: Mentor | undefined) => {
	if (!mentor) return;
	const response = await axios.get('/mentor/' + mentor.id);
	console.log({ response });
	const events = await axios.get('/api/events?mentor=' + mentor.id).then((res) => res.data);
	const noEventChat = await axios.put('/mentor/' + mentor.id, {}); // brain with no event attached
	console.log({ noEventChat });
	const promises = events.map(async (event: Event) => {
		const data = await axios
			.put('/mentor/' + mentor.id, {
				eventId: event.id
			})
			.then((res) => {
				return res.data;
			});
		return data;
	});
	const result = await Promise.all(promises).then((res) => res);
	console.log({ result });
	if (result.some((res) => res.failedLogs.length)) {
		const failedDocuments: DocumentForAI[][] = result.map((res) => res.failedLogs);
		console.log({ failedDocuments });
		alert(
			_('Failed to load documents:') +
				failedDocuments.map((docs) => docs.map((doc) => doc.title)).join(', ')
		);
	}
};
