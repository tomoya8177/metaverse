import { writeFile } from 'fs/promises';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/backend/db.js';

export const POST = async ({ request }) => {
	console.log('uploading file');
	const data = await request.formData();
	console.log({ data });
	const uploadedFiles: {
		filename: string;
		title: string;
		type: string;
	}[] = [];
	const files = data.getAll('file') as File[];
	console.log({ files });
	const id = crypto.randomUUID();
	const promises = files.map(async (file, i) => {
		const filename = `${id}-${i}-${file.name}`;
		const filePath = `./userFiles/documentsForAI/${filename}`;
		const buffer = Buffer.from(await file.arrayBuffer());
		const result = await writeFile(filePath, buffer);
		uploadedFiles.push({
			filename,
			title: file.name,
			type: file.type
		});
	});
	await Promise.all(promises);
	console.log({ uploadedFiles });
	return new Response(JSON.stringify(uploadedFiles));
};
