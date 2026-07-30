export abstract class SerialDevice {
	abstract readonly BAUD_RATE: number;
	abstract readonly VID: number;

	public connected = $state(false);

	private port?: SerialPort;
	private writer?: WritableStreamDefaultWriter<Uint8Array>;

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
		const reader = this.port!.readable!.getReader();
		try {
			while (this.connected) {
				const { value, done } = await reader.read();
				if (done) break;
				this.onData(value);
			}
		} finally {
			reader.releaseLock();
		}
	}

	public close(): void {
		this.onClose();
		this.connected = false;
	}
}
