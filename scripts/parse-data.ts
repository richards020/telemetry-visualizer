import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const dataDir = path.join(process.cwd(), 'sample-data');

const structure = JSON.parse(
	fs.readFileSync(path.join(dataDir, 'structure.json'), 'utf-8')
);
console.log('Number of messages in structure.json:', Object.keys(structure.messages).length);

const csvText = fs.readFileSync(
	path.join(dataDir, 'on11rss4ow1xveexewxludvu52_62cgvv91vr.csv'),
	'utf-8'
);
const parsed = Papa.parse(csvText, { header: true });
const records = (parsed.data as any[])
	.filter((row) => row.timestamp) // skip any blank/malformed rows
	.map((row) => {
		const key = `${row.can_bus}:${row.can_id}`;
		const message = structure.messages[key];
		const signal = message?.signals.find((s: any) => s.name === row.name);

		return {
			timestamp: Number(row.timestamp),
			messageName: message?.messageName ?? 'UNKNOWN',
			signalName: row.name,
			unit: signal?.unit ?? '',
			value: row.physical_value ? row.physical_value : Number(row.value)
		};
	});

console.log('Total normalized records:', records.length);
console.log('Sample records:');
console.log(records.slice(0, 3));
console.log(records.find((r) => r.signalName === 'bms_state'));

