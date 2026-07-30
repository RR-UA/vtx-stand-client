<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$/lib/utils';

	export interface InputProps extends HTMLInputAttributes {
		label?: string;
	}

	let { class: className, value = $bindable(), label, ...rest }: InputProps = $props();

	const base =
		'h-8 w-full bg-secondary p-3 text-sm text-foreground focus:outline-none disabled:opacity-50';
</script>

<label for={label} class="flex flex-col gap-1 text-xs text-muted-foreground capitalize">
	{#if label}{label}{/if}
	<input id={label} bind:value class={cn(base, className)} {...rest} />
</label>
