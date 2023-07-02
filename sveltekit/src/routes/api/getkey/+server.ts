import { FileStackAPIKey } from '$env/static/private';

export const GET = () => {
	return new Response(FileStackAPIKey, { status: 200 });
};
