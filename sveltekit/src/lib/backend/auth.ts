import { db } from './db';
import type { Login } from '../types/Login';
import type { User } from '../types/User';
import type { Student } from '$lib/types/Student';
import jwt from 'jsonwebtoken';

const failResponse: loginResponse = {
	result: false,
	user: null
	//	persona: null
};

type loginResponse = {
	result: boolean;
	user: User | null;
	//	persona: Student | User | null;
};

class auth {
	constructor() {}
	async check(login: string | undefined = ''): Promise<loginResponse> {
		if (!login) {
			return failResponse;
		}
		try {
			var decoded = jwt.verify(login, 'shhhhh');
		} catch (err) {
			return failResponse;
		}
		const users = await db.query(`select * from users where id='${decoded.userId}'`);
		if (users.length == 0) return failResponse;
		let personas: Student[] | User[] | null = [];
		return {
			result: true,
			user: users[0]
			//			persona: !!personas ? personas[0] : null
		};
	}
	async find(email: string): Promise<loginResponse> {
		const users: Array<User> = await db.query(`select * from users where email='${email}'`);
		if (users.length == 0) return failResponse;

		return {
			result: true,
			user: users[0]
			//	persona: null
		};
	}
	async mark(userId: string): Promise<Login> {
		var token = jwt.sign({ userId: userId }, 'shhhhh');
		return token;
	}
}
export const Auth = new auth();
