import Papa from 'papaparse';

interface StructureSignal {
	name: string;
	unit: string;
}
interface StructureMessage {
	messageName: string;
	signals: StructureSignal[];
}
interface Structure {
	messages: Record<string, StructureMessage>;
}

export interface TelemetryRecord {
	timestamp: number;
	messageName: string;
	signalName: string;
	unit: string;
	value: number | string;
}

export function parseTelemetryCsv(csvText: string, structure: Structure): TelemetryRecord[] {
	const parsed = Papa.parse(csvText, { header: true });

	return (parsed.data as any[])
		.filter((row) => row.timestamp)
		.map((row) => {
			const key = `${row.can_bus}:${row.can_id}`;
			const message = structure.messages[key];
			const signal = message?.signals.find((s) => s.name === row.name);

			return {
				timestamp: Number(row.timestamp),
				messageName: message?.messageName ?? 'UNKNOWN',
				signalName: row.name,
				unit: signal?.unit ?? '',
				value: row.physical_value ? row.physical_value : Number(row.value)
			};
		});
} 