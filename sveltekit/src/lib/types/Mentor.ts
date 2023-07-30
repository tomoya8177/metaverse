import type { User } from '$lib/frontend/Classes/User';
import type { DocumentForAI } from './DocumentForAI';

export type Mentor = {
	id: string;
	user: string;
	organization: string;
	prompt: string;
	documents: DocumentForAI[];
	userData: User;
};
