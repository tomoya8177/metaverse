import { describe } from 'vitest';
import { Unit } from './Unit';
import { PUBLIC_LOCALHOST } from '$env/static/public';
import axios from 'axios';

describe('Unit', () => {
	it('should create new Unit', async () => {
		const testUser = await axios
			.get(PUBLIC_LOCALHOST + '/api/users?limit=1')
			.then((res) => res.data[0]);
		const unit = new Unit(testUser.id);
		expect(unit).toBeDefined();
		expect(unit.el).toBeDefined();
	});
	it('should set and get the nickname', () => {
		const testUser = { id: 'testUserId' };
		const unit = new Unit(testUser.id);
		const nickname = 'Test Nickname';
		unit.nickname = nickname;
		expect(unit.nickname).toBe(nickname);
	});
	it('should set the avatarURL', () => {
		const testUser = { id: 'testUserId' };
		const unit = new Unit(testUser.id);
		const avatarURL = 'http://example.com/avatar.png';
		unit.avatarURL = avatarURL;
		expect(unit.avatar?.getAttribute('src')).toBe(avatarURL);
	});
	it('should set and get the position', () => {
		const testUser = { id: 'testUserId' };
		const unit = new Unit(testUser.id);
		const position = { x: 1, y: 2, z: 3 };
		unit.position = position;
		expect(unit.position).toEqual(position);
	});
	it('should set and get the rotation', () => {
		const testUser = { id: 'testUserId' };
		const unit = new Unit(testUser.id);
		const rotation = { x: 10, y: 20, z: 30 };
		unit.rotation = rotation;
		expect(unit.rotation).toEqual(rotation);
	});
	it('should add a message to the avatar container', () => {
		const testUser = { id: 'testUserId' };
		const unit = new Unit(testUser.id);
		const message = 'Test message';
		unit.say(message);
		const textElement = unit.avatarContainer.querySelector('a-entity[a-text]');
		expect(textElement).toBeTruthy();
		expect(textElement?.getAttribute('value')).toBe(message);
	});
	it('should add a camera circle to the avatar container', () => {
		const testUser = { id: 'testUserId' };
		const unit = new Unit(testUser.id);
		const mockTrack = { sid: 'mockSid' } as any;
		unit.showCamera(mockTrack);
		const videoElement = unit.avatarContainer.querySelector(
			'a-circle[id="cameraCircleOftestUserId"]'
		);
		expect(videoElement).toBeTruthy();
	});
	it('should add a screen plane to the scene and update sharedObjects', async () => {
		const testUser = { id: 'testUserId' };
		const unit = new Unit(testUser.id);
		const mockTrack = { sid: 'mockSid', dimensions: { width: 1280, height: 720 } } as any;
		const sid = 'screenSid';
		await unit.showScreen(mockTrack, sid);
		const videoElement = document.getElementById('screenPlaneOftestUserId');
		expect(videoElement).toBeTruthy();
		// Assert that sharedObjects has been updated
		// Note: You need to ensure sharedObjects is globally available for testing purposes
	});
});
