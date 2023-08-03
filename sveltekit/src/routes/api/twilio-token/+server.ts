import { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET } from '$env/static/private';
import twilio from 'twilio';
export const POST = async ({ request: request }) => {
	const body = await request.json();
	const AccessToken = twilio.jwt.AccessToken;
	const VideoGrant = AccessToken.VideoGrant;
	// Used when generating any kind of tokens
	// To set up environmental variables, see http://twil.io/secure
	const twilioAccountSid = TWILIO_ACCOUNT_SID;
	const twilioApiKey = TWILIO_API_KEY;
	const twilioApiSecret = TWILIO_API_SECRET;

	const identity = body.userId;

	// Create Video Grant
	const videoGrant = new VideoGrant({
		room: body.roomId
	});

	// Create an access token which we will sign and return to the client,
	// containing the grant we just created
	const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret, {
		identity: identity
	});
	token.addGrant(videoGrant);

	// Serialize the token to a JWT string
	return new Response(JSON.stringify({ result: true, token: token.toJwt() }));
};
