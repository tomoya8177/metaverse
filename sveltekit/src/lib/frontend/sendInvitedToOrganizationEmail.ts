import { page } from '$app/stores';
import { _ } from '$lib/i18n';
import { nl2br } from 'mymetaverse-helper';
import axios from 'axios';
import type { User } from './Classes/User';
import type { Organization } from '$lib/types/Organization';
export const sendInvitedToOrganizationEmail = async (
	fromUser: User,
	toEmail: string,
	organization: Organization,
	url: string
) => {
	const body = `${_(`Hello,`)} ${fromUser.nickname} ${_(
		`invited you to the ${organization.title}.`
	)}
						${_(`Please click the link below to checkout the organization page!`)}
						${url}`;
	const html = nl2br(body.replace(url, `<a href="${url}">${url}</a>`));
	await axios.post('/api/email', {
		to: toEmail, // list of receivers
		cc: fromUser.email,
		subject: _('Invitation from VirtuaCampus'), // Subject line
		text: body, // plain text body
		html: html
	});
};
export const sendJoinedToOrganizationEmail = async (
	toEmail: string,
	organization: Organization,
	url: string
) => {
	const body = `${_(`Hello,`)} ${_(`You've just joined the organization: `)}${organization.title}
						${_(`Please click the link below to checkout the organization page!`)}
						${url}`;
	const html = nl2br(body.replace(url, `<a href="${url}">${url}</a>`));
	await axios.post('/api/email', {
		to: toEmail, // list of receivers
		subject: _('Notification from VirtuaCampus'), // Subject line
		text: body, // plain text body
		html: html
	});
};
