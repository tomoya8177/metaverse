import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, test } from 'vitest';
import TopPage from './+page.svelte';
import { UserStore } from '$lib/store';
import { db } from '$lib/backend/db';
import { Mentor } from '$lib/frontend/Classes/Mentor';
describe('Top Page', () => {
	test('should be rendered correctly', async () => {
		render(TopPage, {
			props: {}
		});
		const createNewOrganizationButton = screen.getByText('Create New Organization');
		const enterSampleRoomButton = screen.getByText('Enter Sample Room');
		const sendButton = screen.getByText('Send');
		const messageInput = screen.getByLabelText('Message');
		expect(createNewOrganizationButton).toBeInTheDocument();
		expect(enterSampleRoomButton).toBeInTheDocument();
		expect(sendButton).toBeInTheDocument();
		expect(messageInput).toBeInTheDocument();
		await new Promise((r) => setTimeout(r, 3000));
		//the first message from AI should already be there
		const messages = screen.getAllByText('Message');
		expect(messages.length).toBeGreaterThan(0);
	});
	test('shoulg an AI return a message when sent a query', async () => {
		const mentor = new Mentor((await db.query(`select * from mentors where 1 limit 1`))[0]);
		await mentor.init();
		render(TopPage, {
			props: { mentor: mentor }
		});
		//let it load mentor
		await new Promise((r) => setTimeout(r, 3000));
		const messages = screen.getAllByText('Message');
		expect(messages.length).toBeGreaterThan(0);
		const sendButton = screen.getByText('Send');
		const messageInput = screen.getByLabelText('Message');

		await fireEvent.input(messageInput, { target: { value: 'Hello' } });
		await fireEvent.click(sendButton);
		await new Promise((r) => setTimeout(r, 3000));
		const messagesNew = screen.getAllByText('Message');
		expect(messagesNew.length).toBeGreaterThan(2);
		console.log(messagesNew[2].innerHTML);
	}, 15000);
});
