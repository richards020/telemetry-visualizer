

import type { TelemetryRecord } from './parseTelemetry';

let latestRecords: TelemetryRecord[] = [];

export function setLatestRecords(records: TelemetryRecord[]) {
	latestRecords = records;
}

export function getLatestRecords(): TelemetryRecord[] {
	return latestRecords;
}

