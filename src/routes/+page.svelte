

<script lang="ts">
	let csvFile: File | null = $state(null);
	let structureFile: File | null = $state(null);
	let loading = $state(false);
	let result: { totalRecords: number; sample: any[] } | null = $state(null);
	let error: string | null = $state(null);



	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!csvFile || !structureFile) {
			error = 'Please select both files';
			return;
		}


		loading = true;
		error = null;
		result = null;

		const formData = new FormData();
		formData.append('csv', csvFile);
		formData.append('structure', structureFile);

		try {
			const res = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				const errBody = await res.json();
				throw new Error(errBody.error ?? 'Upload failed');
			}

			result = await res.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			loading = false;
		}
	}
</script>




<h1>Telemetry Visualizer</h1>


<form onsubmit={handleSubmit}>
	<div>
		<label for="csv">CSV file</label>
		<input
			id="csv"
			type="file"
			accept=".csv"
			onchange={(e) => (csvFile = e.currentTarget.files?.[0] ?? null)}
		/>
	</div>

	<div>
		<label for="structure">structure.json</label>
		<input
			id="structure"
			type="file"
			accept=".json"
			onchange={(e) => (structureFile = e.currentTarget.files?.[0] ?? null)}
		/>
	</div>



	<button type="submit" disabled={loading}>
		{loading ? 'Uploading...' : 'Upload'}
	</button>
</form>

{#if error}
	<p style="color: red">{error}</p>
{/if}

{#if result}
	<p>Parsed {result.totalRecords.toLocaleString()} records.</p>
	<pre>{JSON.stringify(result.sample, null, 2)}</pre>
{/if}

