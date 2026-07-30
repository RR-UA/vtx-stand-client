import { SerialDevice } from './serial.svelte';

const PROMPT = 'ch> ';

/** Controls a tinySA over its USB CDC text shell protocol as a spectrum analyzer. */
export class TinySASerial extends SerialDevice {
	public readonly BAUD_RATE = 115200;
	public readonly VID = 0x0483;

	private readonly decoder = new TextDecoder();
	private buffer = '';
	private pendingCommand: ((response: string) => void) | null = null;

	private points = 8;
	private span = 0;

	protected onData(chunk: Uint8Array): void {
		this.buffer += this.decoder.decode(chunk, { stream: true });

		let promptIndex: number;
		while ((promptIndex = this.buffer.indexOf(PROMPT)) !== -1) {
			const response = this.buffer.slice(0, promptIndex);
			this.buffer = this.buffer.slice(promptIndex + PROMPT.length);
			this.pendingCommand?.(response);
		}
	}

	/**
	 * Sends a shell command and waits for the response up to the next prompt.
	 * @param command Command line without trailing CR.
	 * @param timeout
	 */
	public async sendCommand(command: string, timeout = 3000): Promise<string> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.pendingCommand = null;
				reject(new Error(`tinySA timeout after: "${command}"`));
			}, timeout);

			this.pendingCommand = (response) => {
				clearTimeout(timer);
				this.pendingCommand = null;
				resolve(response);
			};

			this.write(new TextEncoder().encode(`${command}\r`)).catch((err) => {
				clearTimeout(timer);
				this.pendingCommand = null;
				reject(err);
			});
		});
	}

	public async measure(freq: number, samples: number): Promise<{ peak: number; floor: number }> {
		const start = Math.round(freq * 1e6 - this.span / 2);
		const stop = Math.round(freq * 1e6 + this.span / 2);

		const read = async (): Promise<number> => {
			const response = await this.sendCommand(`hop ${start} ${stop} ${this.points} 2`);
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

	/** Returns the device info banner (model, firmware, build). */
	public async info(): Promise<string> {
		return this.sendCommand('info');
	}

	/** Applies analyzer settings. Must be called after {@link connect}. */
	public async configure(
		span: number,
		rbw: number,
		gain = 0,
		repeat = 1,
		attenuate = 20
	): Promise<void> {
		await this.sendCommand('spur off');
		await this.sendCommand(`rbw ${rbw}`);
		await this.sendCommand(`ext_gain ${gain}`);
		await this.sendCommand(`attenuate ${attenuate}`);
		await this.sendCommand(`repeat ${repeat}`);

		this.span = span * 1e3;
		this.points = Math.ceil(this.span / (rbw * 1e3)) + 1;
	}
}
