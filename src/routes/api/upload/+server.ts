import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseTelemetryCsv } from '$lib/server/parseTelemetry';
import { setLatestRecords } from '$lib/server/telemetryStore';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const csvFile = formData.get('csv') as File;
	const structureFile = formData.get('structure') as File;

	if (!csvFile || !structureFile) {
		return json({ error: 'Both csv and structure files are required' }, { status: 400 });
	}

	const csvText = await csvFile.text();
	const structure = JSON.parse(await structureFile.text());
	const records = parseTelemetryCsv(csvText, structure);
	setLatestRecords(records);

	const signalNames = [...new Set(records.map((r) => r.signalName))].sort();

	return json({ totalRecords: records.length, signalNames });
};