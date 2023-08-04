import { Mentor } from '$lib/frontend/Classes/Mentor.js';
import { User } from '$lib/frontend/Classes/User.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const room = await axios.get(`/api/rooms?slug=${params.roomSlug}`).then((res) => res.data[0]);
	if (room.mentor) {
		room.mentorData = await axios
			.get(`/api/mentors/${room.mentor}`)
			.then((res) => new Mentor(res.data));
		room.mentorData.userData = await axios
			.get(`/api/users/${room.mentorData.user}`)
			.then((res) => new User(res.data));
	}
	const messages = await axios
		.get(`/api/messages?room=${room.id}&pinned=1&orderBy=createdAt`)
		.then((res) => res.data);

	return {
		room,
		messages
	};
};
