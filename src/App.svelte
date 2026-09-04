<script lang="ts">
	import { PanelLeft, Radio, RadioOff, Sun } from '@lucide/svelte';

	import { Button, Input, Plot, Switch, Table } from '$/lib';

	import { TestRunner } from '$/services';
	import { Select } from '$/lib/select';

	let theme = $state(localStorage.getItem('theme') === 'dark');
	let tab = $state<'chart' | 'table'>('chart');
	let asideOpen = $state(true);

	const runner = new TestRunner();

	const changeTheme = () => {
		theme = !theme;
		document.documentElement.classList.toggle('dark', theme);
		localStorage.setItem('theme', theme ? 'dark' : 'light');
	};
</script>

<header class="col-span-full flex justify-between p-3">
	<Button variant="ghost" size="icon" onclick={() => (asideOpen = !asideOpen)}>
		<PanelLeft />
	</Button>
	<Button variant="ghost" size="icon" onclick={changeTheme}>
		<Sun />
	</Button>
</header>

<aside class="flex w-75 flex-col gap-3 divide-y text-sm" class:hidden={!asideOpen}>
	<div class="flex flex-wrap items-center justify-between gap-3 p-3 pt-0">
		<span class="font-bold tracking-wider">VTX</span>
		{#if runner.vtx.connected}
			<Radio class="size-10 animate-pulse p-2.5 text-green-500" />
		{:else}
			<RadioOff class="size-10 p-2.5 text-muted-foreground" onclick={() => runner.vtx.connect()} />
		{/if}

		<div class="grid grid-cols-2 gap-2 p-3">
			<Select
				label="Protocol"
				options={runner.protocols}
				onchange={({ currentTarget }) => runner.setProtocol(+currentTarget.value)}
			/>
			<Switch
				label="PIT Mode"
				value={runner.vtx.settings.pit}
				onChange={() => runner.vtx.setPIT(!runner.vtx.settings.pit)}
			/>
			<Input
				label="Frequency (MHz)"
				type="number"
				bind:value={runner.vtx.settings.freq}
				onchange={() => runner.vtx.setFreq(runner.vtx.settings.freq)}
			/>
			<Input
				label="Power"
				type="number"
				bind:value={runner.vtx.settings.power}
				onchange={() => runner.vtx.setPower(runner.vtx.settings.power)}
			/>
		</div>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3 p-3 pt-0">
		<span class="font-bold tracking-wider">SA</span>
		{#if runner.analyzer.connected}
			<Radio class="size-10 animate-pulse p-2.5 text-green-500" />
		{:else}
			<RadioOff
				class="size-10 p-2.5 text-muted-foreground"
				onclick={() => runner.analyzer.connect()}
			/>
		{/if}

		<div class="grid grid-cols-2 gap-2 p-3">
			<Input label="Samples" type="number" bind:value={runner.analyzer.settings.samples} />
			<Input label="Repeat" type="number" bind:value={runner.analyzer.settings.repeat} />
			<Input label="Span (kHz)" type="number" bind:value={runner.analyzer.settings.span} />
			<Input label="RBW (kHz)" type="number" bind:value={runner.analyzer.settings.rbw} />
			<!--			<Input label="Gain (dB)" type="number" bind:value={runner.analyzer.settings.gain} />-->
			<Input label="Attenuate (dB)" type="number" bind:value={runner.analyzer.settings.attenuate} />
		</div>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3 p-3">
		<span class="font-bold tracking-wider">Process</span>

		<div class="grid grid-cols-2 gap-2 p-3">
			<Input label="Start (MHz)" type="number" bind:value={runner.settings.startFreq} />
			<Input label="Stop (MHz)" type="number" bind:value={runner.settings.stopFreq} />
			<Input label="Padding (MHz)" type="number" bind:value={runner.settings.padding} />
			<Input label="Step (MHz)" type="number" bind:value={runner.settings.step} />

			<Input
				label="S21"
				type="file"
				accept=".s2p"
				onchange={({ files }) => runner.loadS2P(files![0])}
			/>
		</div>

		<Button
			class="mx-3 w-full"
			disabled={!runner.vtx.connected || !runner.analyzer.connected}
			onclick={() => (runner.running ? runner.stop() : runner.start())}
		>
			{runner.running ? 'Stop' : 'Start'}
		</Button>
	</div>

	<Button
		variant="ghost"
		href={__RELEASES_URL__}
		target="_blank"
		rel="noopener noreferrer"
		class="mt-auto border-t text-muted-foreground"
	>
		v{__APP_VERSION__}
	</Button>
</aside>

<main
	class="flex min-h-0 min-w-0 flex-col rounded-l bg-gray-200 dark:bg-black"
	class:col-span-full={!asideOpen}
>
	<Plot hidden={tab !== 'chart'} data={runner.points} {theme} />
	<Table hidden={tab !== 'table'} data={runner.points} />

	<Button
		variant="ghost"
		class="border-t"
		onclick={() => (tab = tab === 'chart' ? 'table' : 'chart')}
	>
		{tab === 'chart' ? 'Table' : 'Chart'}
	</Button>
</main>
