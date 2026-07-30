import { VTXSerial, type VTXSettings } from './vtx.svelte';

const SYNC = 0xaa;
const HEADER = 0x55;
const HEADER_LENGTH = 4;
const PITMODE_BIT = 0x02;

enum CMD {
	GET_SETTINGS = 0x03,
	SET_POWER = 0x05,
	SET_FREQUENCY = 0x09,
	SET_MODE = 0x0b
}

enum MODE {
	PIT = 0x01,
	UNLOCK = 0x08
}

export class SmartAudioSerial extends VTXSerial {
	public readonly BAUD_RATE = 4800;
	public readonly VID = 0x303a;

	private buffer: number[] = [];

	private static readonly CRC8_TABLE = Uint8Array.from({ length: 256 }, (_, i) => {
		for (let j = 0; j < 8; j++) i = i & 0x80 ? (i << 1) ^ 0xd5 : i << 1;
		return i & 0xff;
	});

	public static crc(data: number[]): number {
		let crc = 0;
		for (let i = 0; i < data.length; i++) crc = SmartAudioSerial.CRC8_TABLE[crc ^ data[i]];
		return crc;
	}

	private static frame(cmd: CMD, payload: number[] = []): Uint8Array {
		const body = [SYNC, HEADER, cmd, payload.length, ...payload];
		return Uint8Array.from([0x00, ...body, SmartAudioSerial.crc(body)]);
	}

	protected onData(chunk: Uint8Array): void {
		this.buffer.push(...chunk);

		while (this.buffer.length >= HEADER_LENGTH) {
			if (this.buffer[0] !== SYNC) {
				this.buffer.shift();
				continue;
			}

			const length = HEADER_LENGTH + this.buffer[3];
			if (this.buffer.length < length) return;

			const frame = this.buffer.slice(0, length);
			const body = frame.slice(2, length - 1);
			if (frame[length - 1] !== SmartAudioSerial.crc(body)) {
				this.buffer.shift();
				continue;
			}

			this.buffer.splice(0, length);
			this.resolvePending(Uint8Array.from(frame));
		}
	}

	public async getSettings(): Promise<VTXSettings> {
		const [, , , , , power, mode, freqHi, freqLo] = await this.send(
			SmartAudioSerial.frame(CMD.GET_SETTINGS)
		);

		this.settings = {
			freq: (freqHi << 8) | freqLo,
			power: [power, power],
			pit: !!(mode & PITMODE_BIT)
		};

		return this.settings;
	}

	public async setFreq(freq: number): Promise<VTXSettings> {
		await this.send(SmartAudioSerial.frame(CMD.SET_FREQUENCY, [(freq >> 8) & 0xff, freq & 0xff]));
		return this.getSettings();
	}

	public async setPower(power: number): Promise<VTXSettings> {
		await this.send(SmartAudioSerial.frame(CMD.SET_POWER, [power & 0xff]));
		return this.getSettings();
	}

	public async setPIT(mode: boolean): Promise<VTXSettings> {
		const bit = mode ? MODE.PIT : MODE.UNLOCK;
		await this.send(SmartAudioSerial.frame(CMD.SET_MODE, [bit]));
		return this.getSettings();
	}

	public async connect(): Promise<void> {
		await super.connect();
		await this.write(Uint8Array.from([0x7f, 0x01]));
		await this.getSettings();
	}
}
