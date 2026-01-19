'use client';

import { ESPLoader, Transport } from 'esptool-js';
import OtaPartition from '@/esp/OtaPartition';

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
    await this.espLoader.after(skipReset ? 'no_reset' : 'hard_reset');
    await this.espLoader.transport.disconnect();
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

  async readOtadataPartition(
    onPacketReceived?: (
      packet: Uint8Array,
      progress: number,
      totalSize: number,
    ) => void,
  ) {
    return new OtaPartition(
      await this.espLoader.readFlash(0xe000, 0x2000, onPacketReceived),
    );
  }

  async writeOtadataPartition(
    partition: OtaPartition,
    reportProgress?: (
      fileIndex: number,
      written: number,
      total: number,
    ) => void,
  ) {
    await this.writeData(partition.data, 0xe000, reportProgress);
  }

  async readAppPartition(
    partitionLabel: 'app0' | 'app1',
    onPacketReceived?: (
      packet: Uint8Array,
      progress: number,
      totalSize: number,
    ) => void,
  ) {
    const offset = partitionLabel === 'app0' ? 0x10000 : 0x650000;
    return this.espLoader.readFlash(offset, 0x640000, onPacketReceived);
  }

  async readAppPartitionForIdentification(
    partitionLabel: 'app0' | 'app1',
    {
      readSize = 0x6400, // Default to 25KB (0x6400) for fast identification
      offset = 0,
      onPacketReceived,
    }: {
      readSize?: number;
      offset?: number;
      onPacketReceived?: (
        packet: Uint8Array,
        progress: number,
        totalSize: number,
      ) => void;
    } = {},
  ) {
    // Optimized read for firmware identification with flexible read size and offset:
    // - Default (25KB / 0x6400): Fast path, covers 99% of cases
    // - Additional chunks: Specify offset multiples of 25KB until identification succeeds
    // In testing, most firmwares are identified within the first 25KB read, so reading the entire
    // partition is unnecessary in the majority of cases.

    const baseOffset = partitionLabel === 'app0' ? 0x10000 : 0x650000;

    return this.espLoader.readFlash(
      baseOffset + offset,
      readSize,
      onPacketReceived,
    );
  }

  async writeAppPartition(
    partitionLabel: 'app0' | 'app1',
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
    if (data.length < 0xf0000) {
      throw new Error(
        `Data seems too small, are you sure this is the right file?`,
      );
    }

    const offset = partitionLabel === 'app0' ? 0x10000 : 0x650000;

    await this.writeData(data, offset, reportProgress);
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
