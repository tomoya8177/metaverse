import axios from 'axios';

export const load = async ({ params }) => {
	const room = await axios.get('/api/rooms/' + params.roomId).then((res) => res.data);
	room.documents = await axios
		.get('/api/documentsForAI?room=' + params.roomId)
		.then((res) => res.data);
	let mentor;
	if (room.mentor) {
		mentor = await axios.get('/api/mentors/' + room.mentor).then((res) => res.data);
	}
	const mentors = await axios
		.get('/api/mentors?organization=' + room.organization)
		.then((res) => res.data);
	const mentorUsers = await axios
		.get(`/api/users?id=in:'${mentors.map((mentor) => mentor.user).join("','")}'`)
		.then((res) => res.data);
	mentors.forEach((mentor) => {
		mentor.userData = mentorUsers.find((user) => user.id === mentor.user);
	});
	const objects = await axios.get('/api/objects?room=' + room.id).then((res) => res.data);
	return {
		room,
		mentor,
		mentors,
		objects
	};
};
