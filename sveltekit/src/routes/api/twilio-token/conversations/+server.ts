import {
	TWILIO_ACCOUNT_SID,
	TWILIO_API_KEY,
	TWILIO_API_SECRET,
	TWILIO_AUTH_TOKE,
	TWILIO_CHAT_SERVICE_SID
} from '$env/static/private';
import { db } from '$lib/backend/db.js';
import twilio from 'twilio';
export const POST = async ({ request }) => {
	const body = await request.json();

	const AccessToken = twilio.jwt.AccessToken;
	const ChatGrant = AccessToken.ChatGrant;

	// Used when generating any kind of tokens
	// To set up environmental variables, see http://twil.io/secure
	const twilioAccountSid = TWILIO_ACCOUNT_SID;
	const twilioApiKey = TWILIO_API_KEY;
	const twilioApiSecret = TWILIO_API_SECRET;

	// Used specifically for creating Chat tokens
	const serviceSid = TWILIO_CHAT_SERVICE_SID;
	const identity = body.userId;

	// Create a "grant" which enables a client to use Chat as a given user,
	// on a given device
	const chatGrant = new ChatGrant({
		serviceSid: serviceSid
	});

	// Create an access token which we will sign and return to the client,
	// containing the grant we just created
	const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret, {
		identity: identity
	});

	token.addGrant(chatGrant);

	// Serialize the token to a JWT string
	console.log(token.toJwt());
	const client = twilio(twilioAccountSid, TWILIO_AUTH_TOKE);
	const room = (await db.query("select * from rooms where id = '" + body.roomId + "'"))[0];
	let conversation;
	if (room.twilioConversationsSid) {
		conversation = await client.conversations.v1.conversations(room.twilioConversationsSid).fetch();
	} else {
		conversation = await client.conversations.v1.conversations.create({
			friendlyName: room.title,
			uniqueName: room.id
		});
		await db.query(
			"update rooms set twilioConversationsSid = '" +
				conversation.sid +
				"' where id = '" +
				room.id +
				"'"
		);
		room.twilioConversationsSid = conversation.sid;
	}
	let participant;
	try {
		participant = await client.conversations.v1
			.conversations(conversation.sid)
			.participants(body.userId)
			.fetch();
		console.log({ participant });
	} catch (e) {
		//not joined
		participant = await client.conversations.v1
			.conversations(conversation.sid)
			.participants.create({ identity: body.userId });
		console.log(participant);
	}

	return new Response(
		JSON.stringify({ result: true, token: token.toJwt(), conversation, participant })
	);
};
