import { STABILITY_AI_API_KEY } from '$env/static/private';
import axios from 'axios';
import fetch from 'node-fetch';
import { PUBLIC_FileStackAPIKey } from '$env/static/public';
import { db } from '$lib/backend/db.js';

interface GenerationResponse {
	artifacts: Array<{
		base64: string;
		seed: number;
		finishReason: string;
	}>;
}
const engineId = 'stable-diffusion-xl-1024-v1-0';
const apiHost = 'https://api.stability.ai';

export const POST = async ({ request, params }): Promise<Response> => {
	const apiKey = STABILITY_AI_API_KEY;
	const body = await request.json();
	if (!apiKey) throw new Error('Missing Stability API key.');
	const id = crypto.randomUUID();
	await db.query(`insert into promises set id='${id}'`);

	fetch(`${apiHost}/v1/generation/${engineId}/text-to-image`, {
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
	}).then(async (response) => {
		console.log({ response });
		if (!response.ok) {
			return new Response(`Non-200 response: ${await response.text()}`);
		}

		const responseJSON = (await response.json()) as GenerationResponse;
		console.log(responseJSON);

		const image = responseJSON.artifacts[0];
		console.log({ image });
		const buffer = Buffer.from(image.base64, 'base64');
		console.log({ buffer });
		//const blob = new Blob([buffer], { type: 'image/png' }); // Convert Buffer to Blob
		//console.log({ blob });
		//const formData = new FormData();
		//console.log({ formData });
		//formData.append('fileUpload', blob, 'image.png');
		//console.log({ formData });
		const res = await axios.post(
			'https://www.filestackapi.com/api/store/S3?key=' + PUBLIC_FileStackAPIKey,
			buffer,
			{
				headers: {
					'Content-Type': 'image/png'
				}
			}
		);
		console.log(res);
		if (typeof res.data == 'string') {
			//something wrong
			console.log({ res });
		} else {
			res.data.handle = res.data.url?.split('/').pop();
		}
		await db.query(
			`update promises set resolved=true, data='${JSON.stringify(res.data)}' where id='${id}'`
		);
	});

	//const result = await writeFile(filePath, buffer);
	//fs.writeFileSync('./static' + filePath, buffer);
	// console.log({ path: 'https://mymetaverseportal.net' + filePath });

	return new Response(
		JSON.stringify({
			id
		})
	);
};
