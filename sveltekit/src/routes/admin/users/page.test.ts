import { afterEach, beforeEach, describe, expect, it, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';
import { db } from '$lib/backend/db';
import axios from 'axios';
describe('/admin/users', () => {
	let instance: any = null;
	let users: any[];
	let organizations: any[];
	let userRoles: any[];

	beforeEach(async () => {
		//users = await db.query('select * from users where email!="" order by createdAt desc');
		users = await axios.get('http://localhost:5173/api/users').then((res) => res.data);
		organizations = await db.query('select * from organizations where 1');
		userRoles = await db.query('select * from userRoles where 1');
		render(Page, {
			props: {
				data: {
					users,
					organizations,
					userRoles
				}
			}
		});
		//instance = screen.container;
	});

	afterEach(() => {
		instance = null;
	});

	test('page rendered', () => {
		expect(instance).toBeDefined();
	});

	test('renders list of users', () => {
		const userRows = screen.getAllByTestId(/^user\d+$/);
		expect(userRows.length).toBe(Math.min(10, users.length));
	});

	test('opens modal when "New User" button is clicked', async () => {
		const newUserButton = screen.getByTestId('newUserButton');
		expect(newUserButton).toBeInTheDocument();

		await fireEvent.click(newUserButton);

		const modal = screen.getByRole('dialog');
		expect(modal).toBeInTheDocument();

		const nicknameInput = screen.getByLabelText('Nickname');
		const emailInput = screen.getByLabelText('Email');
		const isAdminSwitch = screen.getByLabelText('Is Admin');

		expect(nicknameInput).toBeInTheDocument();
		expect(emailInput).toBeInTheDocument();
		expect(isAdminSwitch).toBeInTheDocument();

		const organizationSelect = screen.getAllByRole('checkbox');
		expect(organizationSelect.length).toBe(organizations.length);

		//click close button
		const closeButton = screen.getByTestId('closeButton');
		await fireEvent.click(closeButton);
		const closedModal = screen.queryByRole('dialog');
		expect(closedModal).toBeNull();
	});
	//test clicking one of the edit buttons

	test('creates new user when "Create" button is clicked', async () => {
		const newUserButton = screen.getByTestId('newUserButton');
		expect(newUserButton).toBeInTheDocument();

		await fireEvent.click(newUserButton);

		const modal = screen.getByRole('dialog');
		expect(modal).toBeInTheDocument();

		const nicknameInput = screen.getByLabelText('Nickname');
		const emailInput = screen.getByLabelText('Email');
		const isAdminSwitch = screen.getByLabelText('Is Admin');

		expect(nicknameInput).toBeInTheDocument();
		expect(emailInput).toBeInTheDocument();
		expect(isAdminSwitch).toBeInTheDocument();

		await fireEvent.input(nicknameInput, { target: { value: 'testUser' } });
		await fireEvent.input(emailInput, { target: { value: 'testUser@narra.jp' } });

		const organizationSelect = screen.getAllByRole('checkbox');
		expect(organizationSelect.length).toBe(organizations.length);
	});

	test('opens modal when "Edit" button is clicked', async () => {
		const editButtons = screen.getAllByTestId(/^editButton\d+$/);
		expect(editButtons.length).toBeGreaterThan(0);
		const editButton = editButtons[0];
		await fireEvent.click(editButton);
		const modal = screen.getByRole('dialog');
		expect(modal).toBeInTheDocument();
		const nicknameInput = screen.getByLabelText('Nickname');
		const emailInput = screen.getByLabelText('Email');
		const isAdminSwitch = screen.getByLabelText('Is Admin');
		expect(nicknameInput).toBeInTheDocument();
		expect(emailInput).toBeInTheDocument();
		expect(isAdminSwitch).toBeInTheDocument();
		const organizationSelect = screen.getAllByRole('checkbox');
		expect(organizationSelect.length).toBe(organizations.length);
	});
	//delete created testuser
});
