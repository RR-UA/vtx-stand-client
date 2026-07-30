<script lang="ts">
	import * as echarts from 'echarts';
	import { onMount } from 'svelte';

	import type { Point } from '$/services/runner.svelte';

	export interface PlotProps {
		data: Point[];
		theme?: boolean;
	}

	let { data, theme, ...rest }: PlotProps = $props();
	let container: HTMLDivElement;
	let chart: echarts.ECharts;

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
				{ name: 'Floor', type: 'line', symbol: 'none' },
				{ name: 'PLL', type: 'line', symbol: 'none' }
			]
		});

		const ro = new ResizeObserver(() => chart.resize());
		ro.observe(container);
		return () => {
			ro.disconnect();
			chart.dispose();
		};
	});

	$effect(() => chart && chart.setTheme(theme ? 'dark' : 'default'));
	$effect(() => {
		if (!chart) return;
		chart.setOption({
			series: [
				{ data: data.map((p) => [p.freq, p.peak]) },
				{ data: data.map((p) => [p.freq, p.floor]) },
				{ data: data.map((p) => [p.freq, p.pll]) }
			]
		});
	});
</script>

<div bind:this={container} {...rest}></div>
