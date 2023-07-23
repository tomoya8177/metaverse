import axios from 'axios';

export const load = async ({ params }) => {
	const event = await axios.get('/api/events/' + params.eventId).then((res) => res.data);
	event.documents = await axios
		.get('/api/documentsForAI?event=' + params.eventId)
		.then((res) => res.data);
	let mentor;
	if (event.mentor) {
		mentor = await axios.get('/api/mentors/' + event.mentor).then((res) => res.data);
	}
	const mentors = await axios
		.get('/api/mentors?organization=' + event.organization)
		.then((res) => res.data);
	const mentorUsers = await axios
		.get(`/api/users?id=in:'${mentors.map((mentor) => mentor.user).join("','")}'`)
		.then((res) => res.data);
	mentors.forEach((mentor) => {
		mentor.userData = mentorUsers.find((user) => user.id === mentor.user);
	});
	const objects = await axios.get('/api/objects?event=' + event.id).then((res) => res.data);
	return {
		event,
		mentor,
		mentors,
		objects
	};
};
