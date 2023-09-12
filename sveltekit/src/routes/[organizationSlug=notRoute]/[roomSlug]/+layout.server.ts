export const ssr = false;

import { apiCall } from '$lib/frontend/Classes/APICall.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const room = await apiCall.getOne(`/api/rooms?slug=${params.roomSlug}`);
	let mentor;
	let mentorUser;
	console.log({ room });
	if (room && room.mentor) {
		mentor = await apiCall.get(`/api/mentors/${room.mentor}`);
		if (!mentor) {
			//mentor is deleted??
			room.mentor = '';
		} else {
			mentorUser = await apiCall.get(`/api/users/${mentor.user}`);
		}
	}
	const messages = await apiCall.get(`/api/messages?room=${room.id}&pinned=1&orderBy=createdAt`);

	return {
		room,
		messages,
		mentor,
		mentorUser
	};
};
