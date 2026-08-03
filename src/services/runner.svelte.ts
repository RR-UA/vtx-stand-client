import { SmartAudio } from './protocols';
import { VTXSerial } from './vtx.svelte';

import { TinySASerial } from './tiny-sa.svelte';

export interface Point {
	freq: number;
	peak: number;
	floor: number;
	pll: number;
}

export interface SweepConfig {
	startFreq: number;
	stopFreq: number;
	padding: number;
	step: number;
	samples: number;
	span: number;
	rbw: number;
	gain: number;
	repeat: number;
	attenuate: number;
}

export const toCsv = (points: Point[]): string => {
	const rows = points.map((p) => `${p.freq},${p.peak},${p.floor},${p.pll}`);
	return ['freq,peak,floor,pll', ...rows].join('\n');
};

export class TestRunner {
	public readonly analyzer = new TinySASerial();

	public vtx = $state<VTXSerial>(new SmartAudio());

	public points = $state<Point[]>([]);
	public running = $state(false);
	public config = $state<SweepConfig>({
		startFreq: 5000,
		stopFreq: 6000,
		padding: 25,
		step: 5,
		samples: 10,
		span: 100,
		rbw: 300,
		gain: -40.9,
		repeat: 5,
		attenuate: 20
	});

	private download(): void {
		const blob = new Blob([toCsv(this.points)], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `spectrum-${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	constructor() {
		void this.analyzer.connect();
		void this.vtx.connect();

		navigator.serial.addEventListener('connect', () => {
			if (!this.analyzer.connected) void this.analyzer.connect();
			if (!this.vtx.connected) void this.vtx.connect();
		});
	}

	public async setProtocol(protocol: VTXSerial): Promise<void> {
		console.log(protocol);
		await this.vtx.close();
		this.vtx = protocol;
		await this.vtx.connect();
	}

	public async start(): Promise<void> {
		if (!this.vtx.connected || !this.analyzer.connected || this.running) return;

		const { startFreq, stopFreq, padding, step, samples, span, rbw, gain, repeat, attenuate } =
			this.config;

		this.running = true;
		this.points = [];

		await this.analyzer.configure(span, rbw, gain, repeat, attenuate);
		await this.vtx.setFreq(startFreq + padding);
		await this.vtx.setPower(2);
		await this.vtx.setPIT(false);

		try {
			for (let freq = startFreq - padding; freq <= stopFreq + padding; freq += step) {
				if (!this.running) break;
				const t0 = performance.now();

				if (freq > startFreq && freq < stopFreq) await this.vtx.setFreq(freq);
				const { peak, floor } = await this.analyzer.measure(freq, samples);
				const pll = Math.round(performance.now() - t0);

				this.points.push({ freq, peak, floor, pll });
			}
		} finally {
			await this.stop();
		}
	}

	public async stop(): Promise<void> {
		this.running = false;
		this.download();
		await this.vtx.close();
	}
}
