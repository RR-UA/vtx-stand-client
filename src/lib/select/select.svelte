<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { cn } from '$/lib/utils';

	export interface SelectProps extends HTMLSelectAttributes {
		options: Record<string, string>[];
		label?: string;
	}

	let { value = $bindable(), class: className, options, label, ...rest }: SelectProps = $props();

	const base =
		'h-8 w-full bg-secondary px-3 text-sm text-foreground cursor-pointer focus:outline-none';
</script>

<label for={label} class="flex flex-col gap-1 text-xs text-muted-foreground capitalize">
	{#if label}{label}{/if}
	<select id={label} bind:value class={cn(base, className)} {...rest}>
		{#each options as value (value.name)}
			<option {value}>{value.name}</option>
		{/each}
	</select>
</label>
