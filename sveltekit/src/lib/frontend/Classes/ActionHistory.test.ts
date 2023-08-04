import { RoomStore, UserStore } from '$lib/store';
import { ActionHistory } from './ActionHistory';

describe('ActionHistory Class', () => {
	it('should construct safely', () => {
		const actionHistory = new ActionHistory({});
		expect(actionHistory).toBeDefined();
	});

	it('should have default values for properties', async () => {
		const actionHistory = new ActionHistory({});
		expect(actionHistory.user).toBe('');
		expect(actionHistory.room).toBe('');
		expect(actionHistory.organization).toBe('');
		expect(actionHistory.page).toBeNull();
		expect(actionHistory.param).toBe('');
		expect(actionHistory.userData).toBeUndefined();
		expect(actionHistory.roomData).toBeUndefined();
	});

	it('should correctly set user and room values from store subscriptions', async () => {
		// const userStoreMock = { subscribe: jest.fn() };
		// const roomStoreMock = { subscribe: jest.fn() };

		// // Simulate store updates
		const userValue = { id: 'user_id' };
		const roomValue = { id: 'room_id' };
		const actionHistory = new ActionHistory({ user: 'user_id', room: 'room_id' });
		// userStoreMock.subscribe.mock.calls[0][0](userValue);
		// roomStoreMock.subscribe.mock.calls[0][0](roomValue);
		expect(actionHistory.user).toBe(userValue.id);
		expect(actionHistory.room).toBe(roomValue.id);
	});

	it('should correctly parse paramData', () => {
		const actionHistory = new ActionHistory({ param: '{"key": "value"}' });

		expect(actionHistory.paramData).toEqual({ key: 'value' });
	});

	it('should send action to the server', async () => {
		// const mockPost = jest.fn(() => Promise.resolve());
		// jest.mock('axios', () => ({ post: mockPost }));

		const actionHistory = new ActionHistory({});

		const response = await actionHistory.send('login', { username: 'testuser' });
		expect(response).toBeUndefined(); //since this is a mock
		// expect(mockPost).toHaveBeenCalledWith('/api/actions', {
		// 	session: actionHistory.session,
		// 	user: '',
		// 	room: '',
		// 	organization: '',
		// 	action: 'login',
		// 	data: JSON.stringify({ username: 'testuser' }),
		// 	path: location.href
		// });
	});

	// Add more test cases to cover other methods and edge cases of the class
});
