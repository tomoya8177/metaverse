import { db } from '$lib/backend/db.js';

export const GET = async ({ params }) => {
	const organization = await db.query(
		"delete from organizations where slug = '" + params.organizationSlug + "'"
	);
	await db.query(
		`delete from userRoles where organization not in (select id from organizations where 1)`
	);
	await db.query(
		`delete from organizations where id not in (select organization from userRoles where 1)`
	);
	await db.query(
		`delete from mentors where organization not in (select id from organizations where 1)`
	);
	await db.query(
		`delete from rooms where organization not in (select id from organizations where 1)`
	);
	await db.query(`delete from objects where room not in (select id from rooms where 1)`);
	await db.query(
		`delete from actions where organization not in (select id from organizations where 1)`
	);
	return new Response(JSON.stringify({ result: 'success' }));
};
