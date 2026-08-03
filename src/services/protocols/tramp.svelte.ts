import { VTXSerial, type VTXSettings } from '../vtx.svelte';

const SYNC = 0x0f;
const FRAME_LENGTH = 16;

enum CMD {
	SET_FREQ = 0x46, // 'F'
	SET_POWER = 0x50, // 'P'
	SET_ACTIVE = 0x49, // 'I'
	GET_STATUS = 0x76 // 'v'
}

enum MODE {
	PIT = 0x00,
	UNLOCK = 0x01
}

export class Tramp extends VTXSerial {
	public readonly BAUD_RATE = 115200;
	public readonly VID = 0x303a;

	private buffer: number[] = [];

	private static crc(data: number[] | Uint8Array): number {
		let sum = 0;
		for (let i = 1; i < 14; i++) sum += data[i];
		return sum & 0xff;
	}

	private static frame(cmd: CMD, payload: number[] = []): Uint8Array {
		const frame = new Uint8Array(FRAME_LENGTH);
		frame.set([SYNC, cmd, ...payload]);
		frame[14] = Tramp.crc(frame);
		return frame;
	}

	protected onData(chunk: Uint8Array): void {
		this.buffer.push(...chunk);

		while (this.buffer.length >= FRAME_LENGTH) {
			if (this.buffer[0] !== SYNC) {
				this.buffer.shift();
				continue;
			}

			const frame = this.buffer.slice(0, FRAME_LENGTH);
			if (frame[14] !== Tramp.crc(frame)) {
				this.buffer.shift();
				continue;
			}

			this.buffer.splice(0, FRAME_LENGTH);
			this.resolvePending(Uint8Array.from(frame));
		}
	}

	public async getSettings(): Promise<VTXSettings> {
		const frame = await this.send(Tramp.frame(CMD.GET_STATUS));

		this.settings = {
			freq: frame[2] | (frame[3] << 8),
			power: [frame[4] | (frame[5] << 8), frame[8] | (frame[9] << 8)],
			pit: !!frame[7]
		};

		return this.settings;
	}

	public async setFreq(freq: number): Promise<VTXSettings> {
		await this.write(Tramp.frame(CMD.SET_FREQ, [freq & 0xff, (freq >> 8) & 0xff]));
		return this.getSettings();
	}

	public async setPower(power: number): Promise<VTXSettings> {
		await this.write(Tramp.frame(CMD.SET_POWER, [power & 0xff, (power >> 8) & 0xff]));
		return this.getSettings();
	}

	public async setPIT(mode: boolean): Promise<VTXSettings> {
		if (this.settings.pit === mode) return this.settings;
		await this.write(Tramp.frame(CMD.SET_ACTIVE, [mode ? MODE.PIT : MODE.UNLOCK]));
		return this.getSettings();
	}

	public async connect(): Promise<void> {
		await super.connect();
		await this.write(Uint8Array.from([0x7f, 0x02]));
		await this.getSettings();
		await this.setPIT(true);
	}
}
