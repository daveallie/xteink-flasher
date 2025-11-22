/* eslint-disable no-bitwise */
import crc32 from 'crc/crc32';

interface PartitionStatus {
  partitionLabel: 'app0' | 'app1';
  sequence: number;
  state:
    | 'new'
    | 'pending_verify'
    | 'valid'
    | 'invalid'
    | 'aborted'
    | 'undefined';
  crcBytes: Uint8Array;
  crcValid?: boolean;
}

function numberWordToLeBytes(word: number) {
  return new Uint8Array([
    word & 0xff,
    (word >> 8) & 0xff,
    (word >> 16) & 0xff,
    (word >> 24) & 0xff,
  ]);
}

function leBytesToNumberWord(bytes: Uint8Array) {
  return (
    (bytes.at(0) ?? 0) +
    ((bytes.at(1) ?? 0) << 8) +
    ((bytes.at(2) ?? 0) << 16) +
    ((bytes.at(3) ?? 0) << 24)
  );
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

// ESP_OTA_IMG_NEW             = 0x0U,         /*!< Monitor the first boot. In bootloader this state is changed to ESP_OTA_IMG_PENDING_VERIFY. */
// ESP_OTA_IMG_PENDING_VERIFY  = 0x1U,         /*!< First boot for this app was. If while the second boot this state is then it will be changed to ABORTED. */
// ESP_OTA_IMG_VALID           = 0x2U,         /*!< App was confirmed as workable. App can boot and work without limits. */
// ESP_OTA_IMG_INVALID         = 0x3U,         /*!< App was confirmed as non-workable. This app will not selected to boot at all. */
// ESP_OTA_IMG_ABORTED         = 0x4U,         /*!< App could not confirm the workable or non-workable. In bootloader IMG_PENDING_VERIFY state will be changed to IMG_ABORTED. This app will not selected to boot at all. */
// ESP_OTA_IMG_UNDEFINED       = 0xFFFFFFFFU,  /*!< Undefined. App can boot and work without limits. */
function stateFromBytes(data: Uint8Array): PartitionStatus['state'] {
  const state = leBytesToNumberWord(data);

  if (state === 0) return 'new';
  if (state === 1) return 'pending_verify';
  if (state === 2) return 'valid';
  if (state === 3) return 'invalid';
  if (state === 4) return 'aborted';
  if (state === 0xffffffff) return 'undefined';

  throw new Error('Invalid state');
}

function bytesFromState(state: PartitionStatus['state']): Uint8Array {
  if (state === 'new') return numberWordToLeBytes(0);
  if (state === 'pending_verify') return numberWordToLeBytes(0);
  if (state === 'valid') return numberWordToLeBytes(0);
  if (state === 'invalid') return numberWordToLeBytes(0);

  throw new Error('Invalid state');
}

function generateCrc32Le(sequence: number) {
  const value = crc32(numberWordToLeBytes(sequence).buffer, 0xffffffff);
  return numberWordToLeBytes(value);
}

export default class OtaPartition {
  data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  checkPartitionStatuses(): [PartitionStatus, PartitionStatus] {
    return [this.getPartitionStatus('app0'), this.getPartitionStatus('app1')];
  }

  getCurrentBootPartition() {
    const bootPartition = this.checkPartitionStatuses()
      .filter(
        ({ state, crcValid }) =>
          !['invalid', 'aborted'].includes(state) && crcValid,
      )
      .sort((a, b) => b.sequence - a.sequence)[0];

    return bootPartition;
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
      state: 'new',
      crcBytes: generateCrc32Le(nextSequence),
    });
  }

  private getPartitionStatus(
    partitionLabel: PartitionStatus['partitionLabel'],
  ) {
    const offset = partitionLabel === 'app1' ? 0x1000 : 0;

    const sequenceBytes = this.data.slice(offset, offset + 4);
    const sequence = leBytesToNumberWord(sequenceBytes);
    const stateBytes = this.data.slice(offset + 0x18, offset + 0x1c);
    const crcBytes = this.data.slice(offset + 0x1c, offset + 0x20);
    const expectedCrcBytes = generateCrc32Le(sequence);

    return {
      partitionLabel,
      sequence,
      state: stateFromBytes(stateBytes),
      crcBytes,
      crcValid: isEqualBytes(crcBytes, expectedCrcBytes),
    };
  }

  private setPartitionStatus(partition: PartitionStatus) {
    const offset = partition.partitionLabel === 'app1' ? 0x1000 : 0;

    this.data.set(numberWordToLeBytes(partition.sequence), offset);
    this.data.set(bytesFromState(partition.state), offset + 0x18);
    this.data.set(generateCrc32Le(partition.sequence), offset + 0x1c);
  }
}
