// telemetryStore.ts
// Holds the most recently uploaded telemetry data in memory (for fast access
// while the server is running) AND persists it to disk as a JSON file, so
// an upload actually survives a server restart - satisfying the "store" part
// of the requirements, without needing a real database for this scope.

import fs from 'fs';
import path from 'path';
import type { TelemetryRecord } from './parseTelemetry';

const STORAGE_DIR = path.join(process.cwd(), 'storage');
const STORAGE_FILE = path.join(STORAGE_DIR, 'latest-upload.json');

// In-memory cache so repeated requests (chart, analytics) don't have to
// re-read the file from disk every time.
let latestRecords: TelemetryRecord[] = [];

export function setLatestRecords(records: TelemetryRecord[]) {
	latestRecords = records;

	// Persist to disk so this data isn't lost if the server restarts.
	fs.mkdirSync(STORAGE_DIR, { recursive: true });
	fs.writeFileSync(STORAGE_FILE, JSON.stringify(records));
}

export function getLatestRecords(): TelemetryRecord[] {
	// If memory is empty (e.g. right after a server restart) but a saved
	// file exists on disk, load it back in instead of returning nothing.
	if (latestRecords.length === 0 && fs.existsSync(STORAGE_FILE)) {
		const fileContents = fs.readFileSync(STORAGE_FILE, 'utf-8');
		latestRecords = JSON.parse(fileContents);
	}

	return latestRecords;
}

