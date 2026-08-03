export abstract class SerialDevice {
	abstract readonly BAUD_RATE: number;
	abstract readonly VID: number;

	public connected = $state(false);

	private writer?: WritableStreamDefaultWriter<Uint8Array>;
	private reader?: ReadableStreamDefaultReader<Uint8Array>;
	private port?: SerialPort;

	public async connect(): Promise<void> {
		const ports = await navigator.serial.getPorts();
		this.port = ports.find((p) => p.getInfo().usbVendorId === this.VID);

		if (!this.port)
			this.port = await navigator.serial.requestPort({ filters: [{ usbVendorId: this.VID }] });

		await this.port.open({ baudRate: this.BAUD_RATE });
		this.writer = this.port.writable!.getWriter();
		this.connected = true;
		this.onOpen();
		this.readLoop().catch(() => this.close());
	}

	protected async write(data: Uint8Array): Promise<void> {
		await this.writer?.write(data);
	}

	protected abstract onData(chunk: Uint8Array): void;
	protected onOpen(): void {}
	protected onClose(): void {}

	private async readLoop(): Promise<void> {
		this.reader = this.port!.readable!.getReader();
		try {
			while (this.connected) {
				const { value, done } = await this.reader.read();
				if (done) break;
				this.onData(value);
			}
		} finally {
			this.reader.releaseLock();
		}
	}

	public async close(): Promise<void> {
		if (!this.connected) return;
		this.connected = false;
		this.onClose();

		if (this.reader) {
			await this.reader.cancel();
		}

		if (this.writer) {
			await this.writer.close();
			this.writer.releaseLock();
			this.writer = undefined;
		}

		await this.port?.close();
		this.port = undefined;
	}
}
