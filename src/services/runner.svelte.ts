import { SmartAudio, Tramp } from './protocols';
import { VTXSerial } from './vtx.svelte';

import { TinySASerial } from './tiny-sa.svelte';

import type { S21Point } from './s2p';
import * as s2p from './s2p';

export class Point {
	freq: number = 0;
	peak: number = 0;
	floor: number = 0;
	pll: number = 0;
	s21: number = 0;
}

export interface RunnerSettings {
	startFreq: number;
	stopFreq: number;
	padding: number;
	step: number;
}

export const toCsv = (points: Point[]): string => {
	const rows = points.map((p) => Object.values(p).join());
	return ['freq,peak,floor,pll,s21', ...rows].join('\n');
};

export class TestRunner {
	private s2p: S21Point[] = [];

	public protocols = [SmartAudio, Tramp];

	public readonly analyzer = new TinySASerial();
	public vtx = $state<VTXSerial>(new SmartAudio());
	public points = $state<Point[]>([new Point()]);
	public running = $state(false);
	public settings = $state<RunnerSettings>({
		startFreq: 5000,
		stopFreq: 6000,
		padding: 25,
		step: 5
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
		void this.vtx.connect().catch(() => {});

		navigator.serial.addEventListener('connect', () => {
			if (!this.analyzer.connected) void this.analyzer.connect();
			if (!this.vtx.connected) void this.vtx.connect();
		});

		window.addEventListener('beforeunload', () => {
			void this.analyzer.close();
			void this.vtx.close();
		});
	}

	public async loadS2P(file: File): Promise<void> {
		this.s2p = await file.text().then(s2p.parse);
	}

	public async setProtocol(protocol: number): Promise<void> {
		await this.vtx.close();

		this.vtx = new this.protocols[protocol]();
		await this.vtx.connect();
	}

	public async start(): Promise<void> {
		if (!this.vtx.connected || !this.analyzer.connected || this.running) return;

		const { startFreq, stopFreq, padding, step } = this.settings;

		this.running = true;
		this.points = [];

		await this.analyzer.configure();
		await this.vtx.setPower(this.vtx.settings.power);
		await this.vtx.setFreq(startFreq + padding);
		await this.vtx.setPIT(false);

		try {
			for (let freq = startFreq - padding; freq <= stopFreq + padding; freq += step) {
				if (!this.running) break;
				const t0 = performance.now();

				if (freq > startFreq && freq < stopFreq) await this.vtx.setFreq(freq);
				const { peak, floor } = await this.analyzer.measure(freq);
				const pll = Math.round(performance.now() - t0);
				const s21 = s2p.interpolate(this.s2p, freq);
				this.points.push({ freq, peak, floor, pll, s21 });
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
