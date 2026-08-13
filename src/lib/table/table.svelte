<script lang="ts">
	import type { Point } from '$/services/runner.svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$/lib/utils.js';

	export interface TableProps extends HTMLAttributes<HTMLDivElement> {
		class?: string;
		data: Point[];
	}

	let { class: className, data, ...rest }: TableProps = $props();
	let sortKey = $state<keyof Point | null>(null);
	let sortDesc = $state(false);
	let order = $state<number[]>([]);

	const base = 'flex-1 grid overflow-auto bg-inherit text-center';

	const columns = $derived(data.length ? (Object.keys(data[0]) as (keyof Point)[]) : []);

	const sort = (key: keyof Point) => {
		sortDesc = sortKey === key ? !sortDesc : false;
		sortKey = key;
		order = order.slice().sort((a, b) => (data[a][key] - data[b][key]) * (sortDesc ? -1 : 1));
	};

	$effect(() => {
		while (order.length < data.length) order.push(order.length);
	});
</script>

<div
	class={cn(base, className)}
	style="grid-template-columns: repeat({columns.length}, 1fr)"
	{...rest}
>
	{#each columns as key (key)}
		<button class="sticky top-0 border-r border-b bg-inherit p-2" onclick={() => sort(key)}>
			{key}
			<span class="inline-block w-3">{sortKey === key ? (sortDesc ? '↓' : '↑') : ''}</span>
		</button>
	{/each}

	{#each order as i (i)}
		{#each columns as key (key)}
			<input
				class="w-full border-r border-b p-2 text-right"
				type="number"
				bind:value={data[i][key]}
			/>
		{/each}
	{/each}
</div>
