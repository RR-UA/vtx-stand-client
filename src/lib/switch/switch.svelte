<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$/lib/utils';

	export interface SwitchProps extends Omit<HTMLButtonAttributes, 'value'> {
		label?: string;
		value: boolean;
		onChange?: (v: boolean) => void;
	}

	let {
		value = $bindable(false),
		onChange,
		class: className,
		label,
		...rest
	}: SwitchProps = $props();

	const base = 'inline-flex h-8 p-3 w-full cursor-pointer items-center transition-colors';

	const toggle = () => {
		value = !value;
		onChange?.(!!value);
	};
</script>

<label for={label} class="flex flex-col gap-1 text-xs text-muted-foreground capitalize">
	{#if label}{label}{/if}
	<button
		id={label}
		type="button"
		role="switch"
		aria-checked={value}
		aria-label={label}
		onclick={toggle}
		class={cn(base, value ? 'bg-primary' : 'bg-secondary', className)}
		{...rest}
	>
		<span class="h-4 w-1/3 {value ? 'translate-x-[200%] bg-secondary' : 'translate-x-0 bg-primary'}"
		></span>
	</button>
</label>
