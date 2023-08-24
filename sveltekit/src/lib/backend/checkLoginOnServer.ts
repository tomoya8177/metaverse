import type { User } from '$lib/frontend/Classes/User';
import { Auth } from './auth';

export const checkLoginOnServer = async (
	login: string
): Promise<{
	loggedIn: boolean;
	user?: User | undefined;
}> => {
	const result = await Auth.check(login);

	if (result.result) {
		//logged in
		const user = result.user;
		//UserStore.set(user);
		return { loggedIn: true, user: user };
	}
	//not logged in
	return { loggedIn: false };
};
