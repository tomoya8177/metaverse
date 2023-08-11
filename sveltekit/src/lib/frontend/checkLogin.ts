import { emptyUser } from '$lib/preset/EmptyUser';
import { UserStore } from '$lib/store';
import axios from 'axios';
import type { User } from './Classes/User';

//this function checks if the user is logged in
//if the user is logged in, it sets the user in the UserStore

export const checkLogin = async (): Promise<{ loggedIn: boolean; user?: User | undefined }> => {
	const result = await axios.get('/api/login');
	if (result.data.result) {
		//logged in
		const user = { ...emptyUser, ...result.data.user };
		UserStore.set(user);
		return { loggedIn: true, user: user };
	}
	//not logged in
	return { loggedIn: false };
};
