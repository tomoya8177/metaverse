import {
	EtherealPassword,
	EtherealUser,
	EtherealHost,
	MailerHost,
	MailerUser,
	MailerPassword,
	FROM_EMAIL
} from '$env/static/private';
import nodemailer from 'nodemailer';

export const POST = async ({ request }) => {
	const body = await request.json();

	let transporter2 = nodemailer.createTransport({
		host: MailerHost,
		port: 465,
		secure: true, // true for 465, false for other ports
		auth: {
			user: MailerUser,
			pass: MailerPassword
		}
	});
	const mailData = {
		from: FROM_EMAIL, // sender address
		to: body.to, // list of receivers
		cc: body.cc,
		subject: body.subject, // Subject line
		text: body.body, // plain text body
		html: body.html, // html body
		attachments: []
	};
	if (body.attachments) {
		mailData.attachments = body.attachments;
	}
	let info2 = await transporter2.sendMail(mailData);
	console.log('Message sent: %s', info2.messageId);
	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

	// Preview only available when sending through an Ethereal account
	console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info2));
	return new Response(
		JSON.stringify({
			messageId: info2.messageId,
			previewURL: nodemailer.getTestMessageUrl(info2),
			result: 'success'
		}),
		{ status: 200 }
	);
};
