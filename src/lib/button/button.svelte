<script lang="ts">
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$/lib/utils';

	type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: keyof typeof variants;
			size?: keyof typeof sizes;
		};

	const base =
		'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:shrink-0';

	const variants = {
		default: 'bg-primary text-primary-foreground hover:bg-primary/90',
		secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
		ghost: 'hover:bg-muted hover:text-foreground'
	};

	const sizes = {
		default: 'h-10 px-6 text-sm',
		icon: 'size-10 rounded-full'
	};

	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		...rest
	}: ButtonProps = $props();

	const classes = $derived(cn(base, variants[variant], sizes[size], className));
</script>

{#if href}
	<a
		bind:this={ref}
		class={classes}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		{...rest}
	>
		{@render children?.()}
	</a>
{:else}
	<button bind:this={ref} class={classes} {type} {disabled} {...rest}>
		{@render children?.()}
	</button>
{/if}
