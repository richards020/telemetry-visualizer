import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLatestRecords } from '$lib/server/telemetryStore';

export const GET: RequestHandler = async ({ url }) => {
	const name = url.searchParams.get('name');
	if (!name) {
		return json({ error: 'Missing name query param' }, { status: 400 });
	}

	const records = getLatestRecords()
		.filter((r) => r.signalName === name && typeof r.value === 'number')
		.sort((a, b) => a.timestamp - b.timestamp);

	return json({
		points: records.map((r) => ({ x: r.timestamp, y: r.value })),
		unit: records[0]?.unit ?? ''
	});
}; 