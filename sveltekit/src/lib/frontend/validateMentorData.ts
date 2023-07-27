import { _ } from '$lib/i18n';
import type { Mentor } from '$lib/types/Mentor';
import { myAlert } from './toast';

export const validateMentorData = (editMentor: Mentor) => {
	if (!editMentor.userData || !editMentor.userData.nickname) {
		myAlert(_('Nickname is required'));
		return false;
	}
	if (!editMentor.userData || !editMentor.userData.avatarURL) {
		myAlert(_('Avatar must be selected'));
		return false;
	}
	return true;
};
