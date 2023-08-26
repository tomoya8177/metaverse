import { emptyUser } from '$lib/preset/EmptyUser';
import { UserStore } from '$lib/store';
import axios from 'axios';
import { User } from './Classes/User';
import { apiCall } from './Classes/APICall';

//this function checks if the user is logged in
//if the user is logged in, it sets the user in the UserStore

export const checkLogin = async (): Promise<{ loggedIn: boolean; user?: User | undefined }> => {
	const result = await apiCall.get('/api/login');
	console.log({ resultAtFunction: result });
	if (result.result) {
		//logged in
		const user = new User(result.user);
		UserStore.set(user);
		return { loggedIn: true, user: user };
	}
	//not logged in
	return { loggedIn: false };
};
