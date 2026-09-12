// GET /api/analytics?name=SIGNAL_NAME
// Returns either state transitions or numeric stats, depending on the signal type.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLatestRecords } from '$lib/server/telemetryStore';
import { isStateSignal, getStateTransitions, getSignalStats } from '$lib/server/analytics';

export const GET: RequestHandler = async ({ url }) => {
	const name = url.searchParams.get('name');
	if (!name) {
		return json({ error: 'Missing name query param' }, { status: 400 });
	}

	const records = getLatestRecords();

	// Branch based on signal type - state signals get a transition timeline,
	// numeric signals get summary stats.
	if (isStateSignal(name)) {
		const transitions = getStateTransitions(records, name);
		return json({ type: 'state', transitions });
	} else {
		const stats = getSignalStats(records, name);
		return json({ type: 'numeric', stats });
	}
};  

