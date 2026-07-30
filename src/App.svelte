<script lang="ts">
	import { PanelLeft, Radio, RadioOff, Sun } from '@lucide/svelte';

	import { Button, Input, Plot, Switch, Table } from '$/lib';

	import { TestRunner, VTXProtocol } from '$/services';
	import { Select } from '$/lib/select';

	let theme = $state(localStorage.getItem('theme') === 'dark');
	let tab = $state<'chart' | 'table'>('chart');
	let asideOpen = $state(true);

	const runner = new TestRunner();
	const { analyzer } = runner;
	const vtx = $derived(runner.vtx);

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
		{#if vtx.connected}
			<Radio class="size-10 animate-pulse p-2.5 text-green-500" />
		{:else}
			<RadioOff class="size-10 p-2.5 text-muted-foreground" onclick={() => vtx.connect()} />
		{/if}

		<div class="grid grid-cols-2 gap-2 p-3">
			<Select
				label="Protocol"
				options={VTXProtocol}
				value={runner.protocol}
				onchange={(e) => runner.setProtocol(e.currentTarget.value as VTXProtocol)}
			/>
			<Input disabled label="Frequency (MHz)" value={vtx.settings.freq} />
			<Input disabled label="Target Power" value={vtx.settings.power[0]} />
			<Input disabled label="ActualPower" value={vtx.settings.power[1]} />
			<div></div>
			<Switch
				label="PIT Mode"
				value={vtx.settings.pit}
				onChange={() => vtx.setPIT(!vtx.settings.pit)}
			/>
		</div>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3 p-3 pt-0">
		<span class="font-bold tracking-wider">SA</span>
		{#if analyzer.connected}
			<Radio class="size-10 animate-pulse p-2.5 text-green-500" />
		{:else}
			<RadioOff class="size-10 p-2.5 text-muted-foreground" onclick={() => analyzer.connect()} />
		{/if}

		<div class="grid grid-cols-2 gap-2 p-3">
			<Input label="Samples" type="number" bind:value={runner.config.samples} />
			<Input label="Repeat" type="number" bind:value={runner.config.repeat} />
			<Input label="Span (kHz)" type="number" bind:value={runner.config.span} />
			<Input label="RBW (kHz)" type="number" bind:value={runner.config.rbw} />
			<Input label="Gain (dB)" type="number" bind:value={runner.config.gain} />
			<Input label="Attenuate (dB)" type="number" bind:value={runner.config.attenuate} />
		</div>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3 p-3">
		<span class="font-bold tracking-wider">Process</span>

		<div class="grid grid-cols-2 gap-2 p-3">
			<Input label="Start (MHz)" type="number" bind:value={runner.config.startFreq} />
			<Input label="Stop (MHz)" type="number" bind:value={runner.config.stopFreq} />
			<Input label="Padding (MHz)" type="number" bind:value={runner.config.padding} />
			<Input label="Step (MHz)" type="number" bind:value={runner.config.step} />
		</div>

		<Button
			class="mx-3 w-full"
			disabled={!vtx.connected || !analyzer.connected}
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

<main class="flex min-h-0 flex-col rounded-l bg-gray-200 dark:bg-black">
	{#if tab === 'chart'}
		<Plot class="flex-1" data={runner.points} {theme} />
	{:else}
		<Table class="flex-1" data={runner.points} />
	{/if}

	<Button
		variant="ghost"
		class="border-t"
		onclick={() => (tab = tab === 'chart' ? 'table' : 'chart')}
	>
		{tab === 'chart' ? 'Table' : 'Chart'}
	</Button>
</main>
