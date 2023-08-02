import { describe } from 'vitest';
import { Room } from './Room';
import { db } from '$lib/backend/db';

describe('Room Class', () => {
	let roomData: any;

	beforeEach(async () => {
		// Fetch a random room from the database to use for testing
		roomData = await db.query(`select * from rooms where 1`).then((rows) => {
			return rows[Math.floor(Math.random() * rows.length)];
		});
	});

	it('should create a new Room object', () => {
		const room = new Room(roomData);
		expect(room).toBeDefined();
		expect(room).toBeInstanceOf(Room);
		expect(room.id).toBe(roomData.id);
		expect(room.title).toBe(roomData.title);
		// Add more property assertions as needed
	});

	it('should get the correct capacity', () => {
		const room = new Room(roomData);
		expect(room.capacity).toBe(50);
	});

	it('should set allowedUsersArray to an empty array if allowedUsers is empty', () => {
		const room = new Room(roomData);
		room.allowedUsers = ''; // Set allowedUsers to empty string
		expect(room.allowedUsersArray).toEqual([]);
	});

	it('should parse the allowedUsers string and set allowedUsersArray', () => {
		const room = new Room(roomData);
		room.allowedUsers = '["user1", "user2"]';
		expect(room.allowedUsersArray).toEqual(['user1', 'user2']);
	});
});
