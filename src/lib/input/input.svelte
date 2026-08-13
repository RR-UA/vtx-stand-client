<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$/lib/utils';

	export interface InputProps extends Omit<HTMLInputAttributes, 'onchange'> {
		label?: string;
		onchange?: (target: HTMLInputElement) => void;
	}

	let { class: className, value = $bindable(), label, onchange, ...rest }: InputProps = $props();

	const base =
		'h-8 flex-1 w-full bg-secondary p-3 text-sm text-foreground focus:outline-none disabled:opacity-50 file:cursor-pointer file:color';
</script>

<label for={label} class="flex flex-col gap-1 text-xs text-muted-foreground capitalize">
	{#if label}{label}{/if}
	<input
		id={label}
		bind:value
		class={cn(base, className)}
		onchange={(e: Event & { currentTarget: HTMLInputElement }) => onchange?.(e.currentTarget)}
		{...rest}
	/>
</label>
