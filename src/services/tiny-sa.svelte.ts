import { SerialDevice } from './serial.svelte';

export interface TinySASettings {
	samples: number;
	span: number;
	rbw: number;
	gain: number;
	repeat: number;
	attenuate: number;
}

const PROMPT = 'ch> ';

export class TinySASerial extends SerialDevice {
	public readonly BAUD_RATE = 115200;
	public readonly VID = 0x0483;

	public settings = $state<TinySASettings>({
		samples: 10,
		span: 100,
		rbw: 300,
		gain: 0,
		repeat: 5,
		attenuate: 20
	});

	private readonly decoder = new TextDecoder();
	private pending: ((response: string) => void) | null = null;
	private buffer = '';

	private points = 8;

	protected onData(chunk: Uint8Array): void {
		this.buffer += this.decoder.decode(chunk, { stream: true });

		let promptIndex: number;
		while ((promptIndex = this.buffer.indexOf(PROMPT)) !== -1) {
			const response = this.buffer.slice(0, promptIndex);
			this.buffer = this.buffer.slice(promptIndex + PROMPT.length);
			this.pending?.(response);
		}
	}

	public async send(command: string, timeout = 1000): Promise<string> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.pending = null;
				reject(new Error(`tinySA timeout after: "${command}"`));
			}, timeout);

			this.pending = (response) => {
				clearTimeout(timer);
				this.pending = null;
				resolve(response);
			};

			this.write(new TextEncoder().encode(`${command}\r`)).catch((err) => {
				clearTimeout(timer);
				this.pending = null;
				reject(err);
			});
		});
	}

	public async measure(freq: number): Promise<{ peak: number; floor: number }> {
		const { span, samples } = this.settings;
		const start = Math.round(freq * 1e6 - (span * 1e3) / 2);
		const stop = Math.round(freq * 1e6 + (span * 1e3) / 2);

		const read = async (): Promise<number> => {
			const response = await this.send(`hop ${start} ${stop} ${this.points} 2`);
			const powers = response.split('\r\n').slice(1, -1).map(parseFloat);
			return Math.max(...powers, -Infinity);
		};

		let floor = Infinity,
			peak = -Infinity;

		for (let i = samples; i--;) floor = Math.min(floor, await read());
		for (let stable = 0, limit = samples * 2; stable < samples / 2 && limit--;) {
			const val = await read();
			if (Math.abs(val - floor) < 10) {
				stable = 0;
				continue;
			}
			stable = Math.abs(val - peak) < 0.25 ? stable + 1 : 1;
			peak = val;
		}

		if (peak === -Infinity) peak = floor;
		return { peak, floor };
	}

	public async info(): Promise<string> {
		return this.send('info');
	}

	public async configure(): Promise<void> {
		const { span, rbw, gain, attenuate, repeat } = this.settings;
		await this.send('spur off');
		await this.send(`rbw ${rbw}`);
		await this.send(`ext_gain ${gain}`);
		await this.send(`attenuate ${attenuate}`);
		await this.send(`repeat ${repeat}`);

		this.points = Math.ceil((span * 1e3) / (rbw * 1e3)) + 1;
	}
}
