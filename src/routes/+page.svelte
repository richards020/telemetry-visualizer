<script lang="ts">
	import Chart from 'chart.js/auto';

	// --- Form state: the two files the user picks to upload ---
	let csvFile: File | null = $state(null);
	let structureFile: File | null = $state(null);
	let loading = $state(false);
	let error: string | null = $state(null);

	// --- Data returned after a successful upload ---
	let signalNames: string[] = $state([]);
	let selectedSignal: string = $state('');
	let totalRecords = $state(0);

	// --- Chart + analytics for whichever signal is currently selected ---
	let canvasEl: HTMLCanvasElement;
	let chart: Chart | null = null;
	let analytics: any = $state(null); // holds either { type: 'state', transitions } or { type: 'numeric', stats }

	// Handles the upload form submit: sends both files to /api/upload
	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!csvFile || !structureFile) {
			error = 'Please select both files';
			return;
		}

		loading = true;
		error = null;

		const formData = new FormData();
		formData.append('csv', csvFile);
		formData.append('structure', structureFile);

		try {
			const res = await fetch('/api/upload', { method: 'POST', body: formData });
			if (!res.ok) throw new Error((await res.json()).error ?? 'Upload failed');
			const data = await res.json();
			totalRecords = data.totalRecords;
			signalNames = data.signalNames;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			loading = false;
		}
	}

	// Runs whenever the dropdown selection changes: fetches chart data AND analytics
	// for the newly selected signal, then redraws the chart.
	async function loadSignal() {
		if (!selectedSignal) return;

		// 1. Get the raw points for the line chart
		const res = await fetch(`/api/signal?name=${encodeURIComponent(selectedSignal)}`);
		const data = await res.json();

		if (chart) chart.destroy();
		chart = new Chart(canvasEl, {
			type: 'line',
			data: {
				datasets: [
					{
						label: `${selectedSignal} (${data.unit})`,
						data: data.points,
						borderWidth: 1,
						pointRadius: 0
					}
				]
			},
			options: {
				parsing: false,
				scales: {
					x: { type: 'linear', title: { display: true, text: 'timestamp (ms)' } },
					y: { title: { display: true, text: data.unit || 'value' } }
				}
			}
		});

		// 2. Get the analytics (state transitions OR numeric stats) for the same signal
		const analyticsRes = await fetch(`/api/analytics?name=${encodeURIComponent(selectedSignal)}`);
		analytics = await analyticsRes.json();
	}
</script>

<h1>Telemetry Visualizer</h1>

<!-- Upload form: pick the CSV + structure.json and send them to the server -->
<form onsubmit={handleSubmit}>
	<div>
		<label for="csv">CSV file</label>
		<input id="csv" type="file" accept=".csv" onchange={(e) => (csvFile = e.currentTarget.files?.[0] ?? null)} />
	</div>
	<div>
		<label for="structure">structure.json</label>
		<input id="structure" type="file" accept=".json" onchange={(e) => (structureFile = e.currentTarget.files?.[0] ?? null)} />
	</div>
	<button type="submit" disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
</form>

{#if error}<p style="color: red">{error}</p>{/if}

<!-- Once we have signal names back, show the dropdown + chart + analytics -->
{#if signalNames.length > 0}
	<p>Parsed {totalRecords.toLocaleString()} records across {signalNames.length} signals.</p>

	<label for="signal-select">Choose a signal to plot:</label>
	<select id="signal-select" bind:value={selectedSignal} onchange={loadSignal}>
		<option value="">-- select --</option>
		{#each signalNames as name}
			<option value={name}>{name}</option>
		{/each}
	</select>

	<div style="max-width: 900px; margin-top: 1rem;">
		<canvas bind:this={canvasEl}></canvas>
	</div>

	<!-- Analytics section: renders differently depending on what type came back -->
	{#if analytics?.type === 'state'}
		<h3>State changes for {selectedSignal}</h3>
		<ul>
			{#each analytics.transitions as t}
				<li>t={t.timestamp}ms: {t.from ?? '(start)'} → {t.to}</li>
			{/each}
		</ul>
	{:else if analytics?.type === 'numeric' && analytics.stats}
		<h3>Stats for {selectedSignal}</h3>
		<p>
			Min: {analytics.stats.min.toFixed(2)} |
			Max: {analytics.stats.max.toFixed(2)} |
			Avg: {analytics.stats.avg.toFixed(2)} |
			Readings: {analytics.stats.count.toLocaleString()}
		</p>
	{/if}
{/if}

