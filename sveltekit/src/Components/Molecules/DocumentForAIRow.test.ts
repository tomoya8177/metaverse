import { describe, expect, it, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import DocumentForAIRow from './DocumentForAIRow.svelte';
import axios from 'axios';
describe('DocumentForAIRow', () => {
	let instance: any = null;
	test('that the DocumentForAIRow is rendered', async () => {
		const document = {
			id: crypto.randomUUID(),
			filename: '3dee1f59-a087-454e-8366-079744b6872f-0-envelope216.pdf',
			room: 'a02861b2-f8c3-4c38-ae49-99b866d8a532',
			type: 'application/pdf',
			title: 'envelope216.pdf',
			mentor: null,
			handle: null,
			createdAt: new Date().toISOString()
		};
		render(DocumentForAIRow, {
			props: {
				document: document,
				onDeleteDone: () => {}
			}
		});
		expect(screen.getByText(document.title)).toBeInTheDocument();
		expect(instance).toBeDefined();
		const anchor = screen.getByText(document.title);
		expect(anchor).toBeInTheDocument();
		const deleteButton = screen.getByText('delete').parentNode;
		expect(deleteButton).toBeInTheDocument();
	});
});
