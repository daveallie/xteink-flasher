'use client';

import { ESPLoader, Transport } from 'esptool-js';

export default class EspController {
  static async requestDevice() {
    if (!('serial' in navigator && navigator.serial)) {
      throw new Error(
        'WebSerial is not supported in this browser. Please use Chrome or Edge.',
      );
    }

    return navigator.serial.requestPort({
      filters: [{ usbVendorId: 12346, usbProductId: 4097 }],
    });
  }

  static async fromRequestedDevice() {
    const device = await this.requestDevice();
    return new EspController(device);
  }

  private espLoader;

  constructor(device: SerialPort) {
    const transport = new Transport(device, false);
    this.espLoader = new ESPLoader({
      transport,
      baudrate: 115200,
      romBaudrate: 115200,
      enableTracing: false,
    });
  }

  async connect() {
    await this.espLoader.main();
  }

  async disconnect({ skipReset = false }: { skipReset?: boolean } = {}) {
    await this.espLoader.after(skipReset ? 'no_reset' : undefined);
  }

  async readFullFlash(
    onPacketReceived?: (
      packet: Uint8Array,
      progress: number,
      totalSize: number,
    ) => void,
  ) {
    return this.espLoader.readFlash(0, 0x1000000, onPacketReceived);
  }

  async writeFullFlash(
    data: Uint8Array,
    reportProgress?: (
      fileIndex: number,
      written: number,
      total: number,
    ) => void,
  ) {
    if (data.length !== 0x1000000) {
      throw new Error(
        `Data length must be 0x1000000, but got 0x${data.length.toString().padStart(7, '0')}`,
      );
    }

    await this.writeData(data, 0, reportProgress);
  }

  async writeOtaPartition(
    data: Uint8Array,
    reportProgress?: (
      fileIndex: number,
      written: number,
      total: number,
    ) => void,
  ) {
    if (data.length !== 0x2000) {
      throw new Error(
        `Data length must be 0x2000, but got 0x${data.length.toString().padStart(4, '0')}`,
      );
    }

    await this.writeData(data, 0xe000, reportProgress);
  }

  async writeEmptyOtaPartition(
    reportProgress?: (
      fileIndex: number,
      written: number,
      total: number,
    ) => void,
  ) {
    const u8Array = new Uint8Array(0x2000);
    for (let i = 0; i < 0x2000; i += 1) {
      u8Array[i] = 255;
    }

    await this.writeOtaPartition(u8Array, reportProgress);
  }

  async writeOta0(
    data: Uint8Array,
    reportProgress?: (
      fileIndex: number,
      written: number,
      total: number,
    ) => void,
  ) {
    if (data.length > 0x640000) {
      throw new Error(`Data cannot be larger than 0x640000`);
    }
    if (data.length < 0x320000) {
      throw new Error(
        `Data seems too small, are you sure this is the right file?`,
      );
    }

    await this.writeData(data, 0x10000, reportProgress);
  }

  private async writeData(
    data: Uint8Array,
    address: number,
    reportProgress?: (
      fileIndex: number,
      written: number,
      total: number,
    ) => void,
  ) {
    await this.espLoader.writeFlash({
      fileArray: [
        {
          data: this.espLoader.ui8ToBstr(data),
          address,
        },
      ],
      flashSize: 'keep',
      flashMode: 'keep',
      flashFreq: 'keep',

      eraseAll: false,
      compress: true,
      reportProgress,
    });
  }
}
