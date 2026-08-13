<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { onMount, onDestroy } from 'svelte';

	import * as echarts from 'echarts';

	import type { Point } from '$/services/runner.svelte';
	import { cn } from '$/lib/utils';

	export interface PlotProps extends HTMLAttributes<HTMLDivElement> {
		data: Point[];
		theme?: boolean;
	}

	let { class: className, data, theme, ...rest }: PlotProps = $props();
	let container: HTMLDivElement;
	let chart: echarts.ECharts;
	let ro: ResizeObserver;

	const base = 'flex-1';

	onMount(() => {
		chart = echarts.init(container, { renderer: 'canvas' });
		chart.setOption({
			animation: false,
			backgroundColor: 'transparent',
			legend: { icon: 'rect', right: 'center', top: 0 },
			tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
			toolbox: { top: 0, feature: { saveAsImage: {} } },
			grid: { left: 0, right: 0, top: 60, bottom: 60, containLabel: true },
			xAxis: { type: 'value', name: 'MHz', scale: true },
			yAxis: { type: 'value', name: 'dB' },
			series: [
				{ name: 'Peak', type: 'line', symbol: 'none' },
				{ name: 'Peak Raw', type: 'line', symbol: 'none' },
				{ name: 'Floor Raw', type: 'line', symbol: 'none' },
				{ name: 'PLL', type: 'line', symbol: 'none' },
				{ name: 'S21', type: 'line', symbol: 'none' }
			]
		});

		ro = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			chart.resize({ width, height });
		});
		ro.observe(container);
	});

	onDestroy(() => {
		chart.dispose();
	});

	$effect(() => chart && chart.setTheme(theme ? 'dark' : 'default'));
	$effect(() => {
		if (!chart) return;
		chart.setOption({
			series: [
				{ data: data.map((p) => [p.freq, p.peak - p.s21]) },
				{ data: data.map((p) => [p.freq, p.peak]) },
				{ data: data.map((p) => [p.freq, p.floor]) },
				{ data: data.map((p) => [p.freq, p.pll]) },
				{ data: data.map((p) => [p.freq, p.s21]) }
			]
		});
	});
</script>

<div bind:this={container} class={cn(base, className)} {...rest}></div>
