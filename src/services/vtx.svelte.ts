import { SerialDevice } from './serial.svelte';

export interface VTXSettings {
	freq: number;
	power: [number, number];
	pit: boolean;
}

export abstract class VTXSerial extends SerialDevice {
	private pending: ((frame: Uint8Array) => void) | null = null;

	public settings = $state<VTXSettings>({ freq: 0, power: [0, 0], pit: false });

	public abstract getSettings(): Promise<VTXSettings>;
	public abstract setFreq(freq: number): Promise<VTXSettings>;
	public abstract setPower(power: number): Promise<VTXSettings>;
	public abstract setPIT(mode: boolean): Promise<VTXSettings>;

	protected resolvePending(frame: Uint8Array): void {
		const handler = this.pending;
		if (!handler) return;

		this.pending = null;
		handler(frame);
	}

	protected async send(cmd: Uint8Array, timeout = 500, retries = 3): Promise<Uint8Array> {
		for (let attempt = 0; attempt < retries; attempt++) {
			try {
				return await new Promise<Uint8Array>((resolve, reject) => {
					const timer = setTimeout(() => reject(new Error('timeout')), timeout);
					this.pending = (frame) => {
						clearTimeout(timer);
						resolve(frame);
					};
					this.write(cmd);
				});
			} catch {
				// retry
			} finally {
				this.pending = null;
			}
		}

		throw new Error(`No response after ${retries} retries`);
	}

	public async close(): Promise<void> {
		await this.setPIT(true).catch(() => {});
		await super.close();
	}
}
