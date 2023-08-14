import axios from 'axios';

export const load = async ({ params }) => {
	const room = await axios.get(`/api/rooms?slug=${params.roomSlug}`).then((res) => res.data[0]);
	let mentor;
	let mentorUser;
	if (room.mentor) {
		mentor = await axios.get(`/api/mentors/${room.mentor}`).then((res) => res.data);
		mentorUser = await axios.get(`/api/users/${mentor.user}`).then((res) => res.data);
	}
	const messages = await axios
		.get(`/api/messages?room=${room.id}&pinned=1&orderBy=createdAt`)
		.then((res) => res.data);

	return {
		room,
		messages,
		mentor,
		mentorUser
	};
};
