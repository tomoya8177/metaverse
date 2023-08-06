import { test, expect } from '@playwright/test';
import axios from 'axios';
test.describe('Top Page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});
	test('to see all buttons, and to send first chat message to AI', async ({ page }) => {
		// Expect a title "to contain" a substring.
		//wait for 1 second
		await page.waitForTimeout(1000);
		const loginButton = page.getByRole('link', { name: 'Login' });
		const newClientButton = page.getByRole('button', { name: 'Create New Organization' });
		const enterSampleRoomButton = page.getByRole('button', { name: 'Enter Sample Room' });
		const sendButton = page.getByRole('button', { name: 'Send' });
		await expect(loginButton).toBeVisible();
		await expect(newClientButton).toBeVisible();
		await expect(enterSampleRoomButton).toBeVisible();
		await expect(sendButton).toBeVisible();
		//await expect(page).toHaveTitle(/Playwright/);
		const messageInput = page.getByLabel('Message');
		await messageInput.fill('Hello');
		await sendButton.click();
		await page.waitForTimeout(3000);
		//get by data-role='message'
		const chatMessages = page.locator('.chatMessagesWithAI').getByRole('listitem');
		console.log({ chatMessages });
		// await expect(chatMessages).toBeVisible();
		//expect number of messages to be 3
		await expect(chatMessages).toHaveCount(3);
		//expect second message to be 'Hello'
		await expect(chatMessages.nth(1)).toContainText('Hello');
	});
	test('change language button working', async ({ page }) => {
		await page.waitForTimeout(1000);
		const changeLanguageSelect = page.locator('select');
		changeLanguageSelect.selectOption('日本語');
		//await for the screen reload
		await page.waitForTimeout(1000);
		const sendButton = page.getByRole('button', { name: '送信' });
		await expect(sendButton).toBeVisible();
	});
	test.setTimeout(120000);
	test('Create New Organization with new email', async ({ page }) => {
		await page.waitForTimeout(1000);

		const newEmail = `test${Math.floor(Math.random() * 100000)}@test.com`;
		const createNewOrganizationButton = page.getByRole('button', {
			name: 'Create New Organization'
		});
		await createNewOrganizationButton.click();
		await page.waitForTimeout(500);
		const emailInput = page.getByLabel('Email');
		await emailInput.fill(newEmail);
		const proceedButton = page.getByRole('button', { name: 'Proceed' });
		await proceedButton.click();
		await page.waitForTimeout(1000);
		const verifyButton = page.getByRole('button', { name: 'Verify' });
		const user = await axios
			.get('http://localhost:5173/api/users?email=' + newEmail)
			.then((res) => res.data[0]);
		console.log({ user });
		const verificationCode = user.verificationCode;
		const verificationCodeInput = page.getByLabel('Verification Code');
		//put wrong code
		await verificationCodeInput.fill('123456');
		await verifyButton.click();
		await page.waitForTimeout(500);
		//put correct code

		await verificationCodeInput.fill(verificationCode);
		await verifyButton.click();
		await page.waitForTimeout(500);
		const title = page.getByText(`Let's Create an Organization!`);
		await expect(title).toBeVisible();
		//delete the test user
		const orgNameInput = page.getByLabel('Organization Name');
		expect(orgNameInput).toBeVisible();
		const slugInput = page.getByLabel('Slug');
		const allowRegistrationSwitch = page.getByLabel('Allow Registration by Users');
		expect(allowRegistrationSwitch).toBeVisible();
		const haveAIToGenerateIconButton = page.getByRole('button', {
			name: 'Have AI to generate Icon'
		});
		haveAIToGenerateIconButton.click();
		// await page.waitForTimeout(30000);
		// const teamIcon = page.locator('.teamIcon img');
		// await expect(teamIcon).toBeVisible();

		const nextButton = page.getByRole('button', { name: 'Next' });
		await nextButton.click();
		//shoukld be rejected
		await page.waitForTimeout(500);
		const pleaseEnterTitleError = page.getByText('Please enter a title');
		await expect(pleaseEnterTitleError).toBeVisible();
		await orgNameInput.fill('Test Organization');
		allowRegistrationSwitch.check();
		await page.waitForTimeout(1000);
		//		allowRegistrationSwitch.click();
		await nextButton.click();
		await page.waitForTimeout(5000);
		await expect(pleaseEnterTitleError).not.toBeVisible();
		const virtuaMentorTitle = page.getByText('VirtuaMentor');
		expect(virtuaMentorTitle).toBeVisible();
		const firstNameInput = page.getByLabel('First Name');
		const lastNameInput = page.getByLabel('Last Name');
		const nicknameInput = page.getByLabel('Nickname');
		expect(nicknameInput).toBeVisible();
		await axios.delete('http://localhost:5173/api/users/' + user.id);
	});
});
