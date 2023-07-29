import { STABILITY_AI_API_KEY } from '$env/static/private';
import axios from 'axios';
import fs from 'fs';
import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';
import { PUBLIC_FileStackAPIKey } from '$env/static/public';

interface GenerationResponse {
	artifacts: Array<{
		base64: string;
		seed: number;
		finishReason: string;
	}>;
}
const engineId = 'stable-diffusion-xl-1024-v1-0';
const apiHost = 'https://api.stability.ai';
const apiKey = STABILITY_AI_API_KEY;
export const POST = async ({ request, params }): Promise<Response> => {
	const body = await request.json();
	if (!apiKey) throw new Error('Missing Stability API key.');

	const response = await fetch(`${apiHost}/v1/generation/${engineId}/text-to-image`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			text_prompts: [
				{
					text: body.prompt,
					weight: 1
				}
			],
			cfg_scale: 7,
			height: 1024,
			width: 1024,
			steps: 30,
			samples: 1
			//style_preset: '3d-model'
		})
	});

	if (!response.ok) {
		throw new Error(`Non-200 response: ${await response.text()}`);
	}

	const responseJSON = (await response.json()) as GenerationResponse;

	const filePath = `/out/${crypto.randomUUID()}.png`;
	const image = responseJSON.artifacts[0];

	const buffer = Buffer.from(image.base64, 'base64');
	const result = await writeFile('./static' + filePath, buffer);

	// const formData = new FormData();
	// formData.append('file', image.base64);

	// const res = await axios.post(
	// 	'https://www.filestackapi.com/api/store/S3?key=' + PUBLIC_FileStackAPIKey,
	// 	formData,
	// 	{
	// 		headers: {
	// 			'Content-Type': 'multipart/form-data'
	// 		}
	// 	}
	// );

	// console.log(res.data);

	//const result = await writeFile(filePath, buffer);
	//fs.writeFileSync('./static' + filePath, buffer);
	console.log({ path: filePath });

	return new Response(
		JSON.stringify({
			path: filePath
		})
	);
};
