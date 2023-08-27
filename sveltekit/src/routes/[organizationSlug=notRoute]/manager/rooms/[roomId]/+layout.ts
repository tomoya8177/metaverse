import { apiCall } from '$lib/frontend/Classes/APICall.js';
import axios from 'axios';

export const load = async ({ params }) => {
	const room = await apiCall.get('/api/rooms/' + params.roomId);
	room.documents = await apiCall.get('/api/documentsForAI?room=' + params.roomId);

	let mentor;
	if (room.mentor) {
		mentor = await apiCall.get('/api/mentors/' + room.mentor);
	}
	const mentors = await apiCall.get('/api/mentors?organization=' + room.organization);

	const mentorUsers = await apiCall.get(
		`/api/users?id=in:'${mentors.map((mentor) => mentor.user).join("','")}'`
	);

	mentors.forEach((mentor) => {
		mentor.userData = mentorUsers.find((user) => user.id === mentor.user);
	});
	return {
		room,
		mentor,
		mentors
	};
};
