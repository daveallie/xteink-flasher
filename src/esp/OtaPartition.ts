import crc32 from 'crc/crc32';
import { leBytesToU32, u32ToLeBytes } from '@/utils/bytes';
import {
  OtaPartitionState,
  otaPartitionStateFromBytes,
  otaPartitionStateToBytes,
} from './OtaParitionState';

interface PartitionStatus {
  partitionLabel: 'app0' | 'app1';
  sequence: number;
  state: OtaPartitionState;
  crcBytes: Uint8Array;
  crcValid?: boolean;
}

export function isEqualBytes(bytes1: Uint8Array, bytes2: Uint8Array): boolean {
  if (bytes1.length !== bytes2.length) {
    return false;
  }

  for (let i = 0; i < bytes1.length; i += 1) {
    if (bytes1[i] !== bytes2[i]) {
      return false;
    }
  }

  return true;
}

function generateCrc32Le(sequence: number) {
  const value = crc32(u32ToLeBytes(sequence).buffer, 0xffffffff);
  return u32ToLeBytes(value);
}

export default class OtaPartition {
  constructor(public data: Uint8Array) {}

  parseOtaAppPartitions(): [PartitionStatus, PartitionStatus] {
    return [
      this.parseOtaAppPartition('app0'),
      this.parseOtaAppPartition('app1'),
    ];
  }

  getCurrentBootPartition() {
    const partitions = this.parseOtaAppPartitions();

    return partitions
      .filter(
        ({ state, crcValid }) =>
          !['invalid', 'aborted'].includes(state) && crcValid,
      )
      .sort((a, b) => b.sequence - a.sequence)[0];
  }

  getCurrentBackupPartitionLabel() {
    if (this.getCurrentBootPartition()?.partitionLabel === 'app1') {
      return 'app0';
    }
    return 'app1';
  }

  setBootPartition(partitionLabel: PartitionStatus['partitionLabel']) {
    const currentBootPartition = this.getCurrentBootPartition();

    if (currentBootPartition?.partitionLabel === partitionLabel) {
      return;
    }

    const nextSequence = (currentBootPartition?.sequence ?? 0) + 1;
    this.setPartitionStatus({
      partitionLabel,
      sequence: nextSequence,
      state: OtaPartitionState.NEW,
      crcBytes: generateCrc32Le(nextSequence),
    });
  }

  private parseOtaAppPartition(
    partitionLabel: PartitionStatus['partitionLabel'],
  ) {
    const offset = partitionLabel === 'app1' ? 0x1000 : 0;

    const sequenceBytes = this.data.slice(offset, offset + 4);
    const sequence = leBytesToU32(sequenceBytes);
    const stateBytes = this.data.slice(offset + 0x18, offset + 0x1c);
    const crcBytes = this.data.slice(offset + 0x1c, offset + 0x20);
    const expectedCrcBytes = generateCrc32Le(sequence);

    return {
      partitionLabel,
      sequence,
      state: otaPartitionStateFromBytes(stateBytes),
      crcBytes,
      crcValid: isEqualBytes(crcBytes, expectedCrcBytes),
    };
  }

  private setPartitionStatus(partition: PartitionStatus) {
    const offset = partition.partitionLabel === 'app1' ? 0x1000 : 0;

    this.data.set(u32ToLeBytes(partition.sequence), offset);
    this.data.set(otaPartitionStateToBytes(partition.state), offset + 0x18);
    this.data.set(generateCrc32Le(partition.sequence), offset + 0x1c);
  }
}
