import axios from 'axios';

export const load = async ({ params }) => {
	const mentor = await axios.get('/api/mentors/' + params.mentorId).then((res) => res.data);
	mentor.userData = await axios.get('/api/users/' + mentor.user).then((res) => res.data);
	//await axios.get('/mentor/' + mentor.id);
	await axios.put('/mentor/' + mentor.id, {
		eventId: 'none'
	});
	return {
		mentor
	};
};
