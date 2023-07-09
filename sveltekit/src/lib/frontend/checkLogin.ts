import { emptyUser } from '$lib/preset/EmptyUser';
import { UserStore } from '$lib/store';
import axios from 'axios';

//this function checks if the user is logged in
//if the user is logged in, it sets the user in the UserStore

export const checkLogin = async (): Promise<boolean> => {
	console.log('checking login');
	const result = await axios.get('/api/login');
	console.log({ result });
	if (result.data.result) {
		//logged in
		UserStore.set({ ...emptyUser, ...result.data.user });
		return true;
	}
	//not logged in
	return false;
};
