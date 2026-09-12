// analytics.ts
// Simple, no-frills analytics on top of the parsed telemetry records.
// Two cases handled:
//   1. "State" signals (e.g. bms_state) - we care about WHEN the state changes, not raw numbers
//   2. Numeric signals (e.g. voltage1) - we care about basic stats (min/max/avg) and any values
//      that look out of a safe range

import type { TelemetryRecord } from './parseTelemetry';

// Signals that are enums/states rather than continuous numbers.
// These are the only signals in our data where `value` is a string label
// (from physical_value) instead of a plain number.
const STATE_SIGNALS = ['bms_state', 'INV_Inverter_State', 'INV_VSM_State'];

export function isStateSignal(signalName: string): boolean {
	return STATE_SIGNALS.includes(signalName);
}

// Walks through a state signal's readings in time order and records every
// point where the value actually changed - e.g. LV_POWER -> HV_ENABLED.
// This turns thousands of repeated readings into just the moments that matter.
export function getStateTransitions(records: TelemetryRecord[], signalName: string) {
	const readings = records
		.filter((r) => r.signalName === signalName)
		.sort((a, b) => a.timestamp - b.timestamp);

	const transitions: { timestamp: number; from: string | null; to: string }[] = [];
	let previousValue: string | null = null;

	for (const reading of readings) {
		const currentValue = String(reading.value);
		if (currentValue !== previousValue) {
			transitions.push({
				timestamp: reading.timestamp,
				from: previousValue,
				to: currentValue
			});
			previousValue = currentValue;
		}
	}

	return transitions;
}

// Basic descriptive stats for a numeric signal: min, max, average.
// Also flags a simple "out of range" count if bounds are provided -
// this is a stand-in for real safety thresholds (e.g. voltage limits),
// which a real team would define per-signal.
export function getSignalStats(
	records: TelemetryRecord[],
	signalName: string,
	bounds?: { min: number; max: number }
) {
	const values = records
		.filter((r) => r.signalName === signalName && typeof r.value === 'number')
		.map((r) => r.value as number);

	if (values.length === 0) {
		return null;
	}

	const min = Math.min(...values);
	const max = Math.max(...values);
	const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

	const outOfRangeCount = bounds
		? values.filter((v) => v < bounds.min || v > bounds.max).length
		: 0;

	return { min, max, avg, count: values.length, outOfRangeCount };
}


