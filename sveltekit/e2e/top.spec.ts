import { test, expect, Page, BrowserContext } from '@playwright/test';
import axios from 'axios';
import { PresetAvatars } from '../src/lib/preset/PresetAvatars';
test.describe.serial('Top Page', () => {
	let page: Page;
	let context: BrowserContext;
	const nastyString = `Tomo's nick,name is 0.198@"Japanese" name[0]!?`;
	const nastyParagraph = `
	Tomo's nick,name is 0.198@"Japanese" name[0]!?
	this is a secont line
	`;
	const newEmail = `test${Math.floor(Math.random() * 100000)}@test.com`;
	const newOrgSlug = 'test-org' + Math.floor(Math.random() * 100000);
	test.beforeAll(async ({ browser }) => {
		context = await browser.newContext({
			permissions: ['microphone', 'camera']
		});
		// Create a new page inside context.
		page = await context.newPage();
		//	page = await browser.newPage();
	});
	test.afterAll(async () => {
		const response = await axios
			.get('http://localhost:5173/deleteLonelyData/' + newOrgSlug)
			.then((res) => res.data);
		console.log(response);
		// const response2 = await axios.delete('/api/users?email=' + newEmail).then((res) => res.data);
		// console.log(response2);
	});

	test('to see all buttons, and to send first chat message to AI', async () => {
		// Expect a title "to contain" a substring.
		//wait for 1 second
		await page.goto('/');
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
		await messageInput.fill(nastyParagraph);
		await sendButton.click();
		//get by data-role='message'
		//wait for 3 seconds
		await page.waitForTimeout(3000);
		const chatMessages = page.locator('.chatMessagesWithAI').getByRole('listitem');
		console.log({ chatMessages });
		// await expect(chatMessages).toBeVisible();
		//expect number of messages to be 3
		await expect(chatMessages).toHaveCount(3);
		//expect second message to be 'Hello'
		await expect(chatMessages.nth(1)).toContainText(nastyParagraph);
	});
	test('change language button working', async () => {
		const changeLanguageSelect = page.locator('select');
		changeLanguageSelect.selectOption('日本語');
		//await for the screen reload
		const sendButton = page.getByRole('button', { name: '送信' });
		await expect(sendButton).toBeVisible();
		//set the language backt to en
		changeLanguageSelect.selectOption('English');
		const sendButtonEn = page.getByRole('button', { name: 'Send' });
		await expect(sendButtonEn).toBeVisible();
	});
	test('Register with new Email', async () => {
		await page.waitForTimeout(1000);

		const createNewOrganizationButton = page.getByRole('button', {
			name: 'Create New Organization'
		});
		await createNewOrganizationButton.click();
		const emailInput = page.getByLabel('Email');
		await expect(emailInput).toBeVisible();
		await emailInput.fill(newEmail);
		const proceedButton = page.getByRole('button', { name: 'Proceed' });
		await expect(proceedButton).toBeVisible();
		await proceedButton.click();
		const verifyButton = page.getByRole('button', { name: 'Verify' });
		await expect(verifyButton).toBeVisible();
		const user = await axios
			.get('http://localhost:5173/api/users?email=' + newEmail)
			.then((res) => res.data[0]);
		console.log({ user });
		const verificationCode = user.verificationCode;
		const verificationCodeInput = page.getByLabel('Verification Code');
		await expect(verificationCodeInput).toBeVisible();
		//put wrong code
		await verificationCodeInput.fill(nastyString);
		await verifyButton.click();
		//wrong code visible
		const wrongCodeError = page.getByText('Wrong Code');
		await expect(wrongCodeError).toBeVisible();
		await verificationCodeInput.fill('23445');
		await verifyButton.click();
		//wrong code visible
		const wrongCodeError2 = page.getByText('Wrong Code');
		await expect(wrongCodeError2).toBeVisible();

		//put correct code
		await verificationCodeInput.fill(verificationCode);
		await verifyButton.click();
		const title = page.getByText(`Let's Create an Organization!`);
		await expect(title).toBeVisible({ timeout: 15000 });
	});

	test('Create New Organization', async () => {
		test.setTimeout(120000);

		//set timeout to 120000
		//delete the test user
		const orgNameInput = page.getByLabel('Organization Name');
		await expect(orgNameInput).toBeVisible();
		const slugInput = page.getByLabel('Slug');
		await expect(slugInput).toBeVisible();
		await slugInput.fill(newOrgSlug);
		const allowRegistrationSwitch = page.getByLabel('Allow Registration by Users');
		await expect(allowRegistrationSwitch).toBeVisible();
		const haveAIToGenerateIconButton = page.getByRole('button', {
			name: 'Have AI to generate Icon'
		});
		await expect(haveAIToGenerateIconButton).toBeVisible();
		haveAIToGenerateIconButton.click();
		// await page.waitForTimeout(30000);
		const teamIcon = page.locator('.teamIcon img');
		await expect(teamIcon).toBeVisible({ timeout: 50000 }); //this can take a long time.

		const nextButton = page.getByRole('button', { name: 'Next' });
		await expect(nextButton).toBeVisible();
		await nextButton.click();
		//shoukld be rejected
		await page.waitForTimeout(500);
		const pleaseEnterTitleError = page.getByText('Please enter a title');
		await expect(pleaseEnterTitleError).toBeVisible();
		await orgNameInput.fill(nastyString);
		await allowRegistrationSwitch.check();
		//		allowRegistrationSwitch.click();
		await nextButton.click();
		await expect(pleaseEnterTitleError).not.toBeVisible();
	});
	test('Create New Mentor', async () => {
		const virtuaMentorTitle = page.getByText('VirtuaMentor');
		expect(virtuaMentorTitle).toBeVisible();

		//set up a mentor
		const firstNameInput = page.getByLabel('First Name');
		await expect(firstNameInput).toBeVisible();
		await firstNameInput.fill('Test');
		const lastNameInput = page.getByLabel('Last Name');
		await expect(lastNameInput).toBeVisible();
		await lastNameInput.fill('Mentor');
		const nicknameInput = page.getByLabel('Nickname');
		await expect(nicknameInput).toBeVisible();
		await nicknameInput.fill(nastyString);
		const changeAvatarButton = page.getByRole('button', { name: 'Change Avatar' });
		expect(changeAvatarButton).toBeVisible();
		await changeAvatarButton.click();
		await page.waitForTimeout(3000);
		//expect avatar thumbnails to be visible
		const avatarThumbnails = page.locator('figure');
		await expect(avatarThumbnails).toBeVisible();
		//get all all image element under thumbnails
		const avatarImages = page.locator('figure img');
		//click random avatar
		const randomAvatar = avatarImages.nth(Math.floor(Math.random() * PresetAvatars.length));
		expect(randomAvatar).toBeVisible();
		await randomAvatar.click();
		const OKButton = page.getByRole('button', { name: 'OK' });
		await OKButton.click();
		const HaveAIToWriteIntroductionButton = page.getByRole('button', {
			name: 'Have AI to write the introduction'
		});
		await HaveAIToWriteIntroductionButton.click();
		//wait 10 seconds
		await page.waitForTimeout(10000);
		//find textarea
		const introductionTextarea = page.getByLabel('Introduction');
		await expect(introductionTextarea).toBeVisible();
		//expect the content to be something
		const str = await introductionTextarea.inputValue();
		expect(str.includes('Test Mentor')).toBeTruthy();
		introductionTextarea.fill(nastyParagraph);
		//find AI Voice select
		const aiVoiceSelect = page.getByRole('combobox', { name: 'AI Voice' });
		await expect(aiVoiceSelect).toBeVisible();
		//select random voice
		//await aiVoiceSelect.selectOption('Kyoko');
		//click next
		//find new next button
		const newNextButton = page.getByRole('button', { name: 'Next' });
		await newNextButton.click();
		//heading for room to be there
		const roomHeading = page.getByRole('heading', { name: 'Room' });
		await expect(roomHeading).toBeVisible();
	});
	test('Create New Room', async () => {
		//find title input
		const titleInput = page.getByLabel('Title');
		await expect(titleInput).toBeVisible();
		//fill title
		await titleInput.fill(nastyString);
		//find slug input
		const slugInput2 = page.getByLabel('Slug');
		await expect(slugInput2).toBeVisible();
		await slugInput2.fill('test-room');
		//expect some text to be already in the slug box
		expect((await slugInput2.inputValue()) == 'test-room').toBeTruthy();
		//find VirtuMentor select box
		const virtuMentorSelect = page.getByRole('combobox', { name: 'VirtuaMentor' });
		await expect(virtuMentorSelect).toBeVisible();
		//it should have the name of the mentor
		await expect(virtuMentorSelect).toHaveText(`None${nastyString}`);
		//find another next button
		const anotherNextButton = page.getByRole('button', { name: 'Next' });
		await expect(anotherNextButton).toBeVisible();
		await anotherNextButton.click();
		//await page.waitForTimeout(15000);

		//now you should see the change profile modal as you haven't initialized the nickname graphic
		const changeProfileTitle = page.getByRole('heading', { name: 'Change Profile' });
		await expect(changeProfileTitle).toBeVisible({ timeout: 15000 }); //may take longer than expected
	});
	test('Update Profile', async () => {
		//find nickname input
		const nicknameInput2 = page.getByLabel('Nickname');
		//it should have newEmail before @

		expect((await nicknameInput2.inputValue()) == newEmail.split('@')[0]).toBeTruthy();
		//fill nickname
		await nicknameInput2.fill('Test User');
		//find status input
		const statusInput = page.getByLabel('Status');
		await expect(statusInput).toBeVisible();
		//fill status
		await statusInput.fill(nastyString);
		//find bio input
		const bioInput = page.getByLabel('Bio');
		await expect(bioInput).toBeVisible();
		//fill bio
		await bioInput.fill(nastyParagraph);
		//find update button
		const updateButton = page.getByRole('button', { name: 'Update' });
		await expect(updateButton).toBeVisible();
		await updateButton.click();
		await expect(updateButton).not.toBeVisible({ timeout: 10000 }); // may take longer than expected
		//find enter button
		const enterButton = page.getByRole('button', { name: 'Enter' });
		await expect(enterButton).toBeVisible();
	});
	test('Enter Room', async () => {
		const enterButton = page.getByRole('button', { name: 'Enter' });

		await enterButton.click();
		const enteredNotice = page.getByText('Connected to the room!');
		await expect(enteredNotice).toBeVisible();
		//aframe scene should be in the dom
		const aframeScene = page.locator('a-scene');
		await expect(aframeScene).toBeVisible();
		//textchat box visible
		const textChatBox = page.locator('.chat-box');
		await expect(textChatBox).toBeVisible();
		await page.waitForTimeout(5000);
		const messages = textChatBox.locator("[data-role='message']");
		await expect(messages).toHaveCount(1, { timeout: 10000 }); //you've got one message from mentor
		const chatButton = page.getByRole('button', { name: 'chat' });
		await expect(chatButton).toBeVisible();
		await chatButton.click();
		await expect(textChatBox).not.toBeVisible();
	});
	test('Activate mic', async () => {
		const micOffButton = page.getByRole('button', { name: 'mic_off' });
		await expect(micOffButton).toBeVisible();
		await micOffButton.click();
		//allow mic access
		await context.grantPermissions(['microphone'], { origin: 'http://localhost:5173' });
		await expect(micOffButton).not.toBeVisible();
		const micButton = page.getByRole('button', { name: 'mic' });
		await expect(micButton).toBeVisible();
	});
	// test('Activate camera', async () => {
	// 	const cameraOffButton = page.getByRole('button', { name: 'videocam_off' });
	// 	await expect(cameraOffButton).toBeVisible();
	// 	//wait for 500 ms
	// 	await page.waitForTimeout(500);
	// 	await cameraOffButton.click();
	// 	//allow camera access
	// 	//await context.grantPermissions(['camera'], { origin: 'http://localhost:5173' });
	// 	await expect(cameraOffButton).not.toBeVisible({ timeout: 10000 });
	// 	const cameraButton = page.getByRole('button', { name: 'videocam' });
	// 	await expect(cameraButton).toBeVisible();
	// 	const myCameraPreview = page.locator('#myCameraPreview video');
	// 	await expect(myCameraPreview).toBeVisible();
	// });
	// test('Start Screen Share', async () => {
	// 	const moreButton = page.getByRole('button', { name: 'more_vert' });
	// 	await expect(moreButton).toBeVisible();
	// 	await moreButton.click();
	// 	const startScreenShareButton = page.getByRole('button', { name: 'Share Screen' });
	// 	await expect(startScreenShareButton).toBeVisible();
	// 	await startScreenShareButton.click();
	// });
	test('Leave Room', async () => {
		//find account menu
		const accountMenu = page.getByRole('link', { name: 'Test User' }).nth(1); //because there is another link with the same name
		await expect(accountMenu).toBeVisible();
		//find leave room button
		await accountMenu.click();
		const leaveRoomButton = page.getByRole('button', { name: 'Leave Room' });
		await expect(leaveRoomButton).toBeVisible();
		await leaveRoomButton.click();
		const OKButton2 = page.getByRole('button', { name: 'OK' });
		await expect(OKButton2).toBeVisible();
		await OKButton2.click();

		//manager's console button
		const managersConsoleButton = page.getByRole('button', { name: "Manager's Console" });
		await expect(managersConsoleButton).toBeVisible();

		// you are in the dash board. well done. now let's split the test
		//initiate chat test
	});
	// test('chat test', async () => {
	// 	await page.waitForTimeout(5000);

	// 	//test room button
	// 	const testRoomButton = page.getByRole('button').nth(1);
	// 	await expect(testRoomButton).toBeVisible();
	// 	//test mentor button
	// 	const testMentorButton = page.getByRole('link').nth(3);
	// 	await expect(testMentorButton).toBeVisible();
	// 	await testMentorButton.click();
	// 	await page.waitForTimeout(10000);
	// 	//find test mentor
	// 	const testMentor = page.getByText(/Hello/).nth(0);
	// 	await expect(testMentor).toBeVisible();
	// 	//find textarea
	// 	const messageInput = page.locator('#chat-textarea textarea');
	// 	await expect(messageInput).toBeVisible();
	// 	//fill message
	// 	await messageInput.fill('Hello');
	// 	//find send button
	// 	const sendButton = page.getByRole('button', { name: 'Send' });
	// 	await expect(sendButton).toBeVisible();
	// 	await sendButton.click();
	// 	await page.waitForTimeout(10000);
	// });
});
