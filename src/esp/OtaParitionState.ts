import { leBytesToU32, u32ToLeBytes } from '@/utils/bytes';

// ESP_OTA_IMG_NEW             = 0x0U,         /*!< Monitor the first boot. In bootloader this state is changed to ESP_OTA_IMG_PENDING_VERIFY. */
// ESP_OTA_IMG_PENDING_VERIFY  = 0x1U,         /*!< First boot for this app was. If while the second boot this state is then it will be changed to ABORTED. */
// ESP_OTA_IMG_VALID           = 0x2U,         /*!< App was confirmed as workable. App can boot and work without limits. */
// ESP_OTA_IMG_INVALID         = 0x3U,         /*!< App was confirmed as non-workable. This app will not selected to boot at all. */
// ESP_OTA_IMG_ABORTED         = 0x4U,         /*!< App could not confirm the workable or non-workable. In bootloader IMG_PENDING_VERIFY state will be changed to IMG_ABORTED. This app will not selected to boot at all. */
// ESP_OTA_IMG_UNDEFINED       = 0xFFFFFFFFU,  /*!< Undefined. App can boot and work without limits. */

export enum OtaPartitionState {
  NEW = 'new',
  PENDING_VERIFY = 'pending_verify',
  VALID = 'valid',
  INVALID = 'invalid',
  ABORTED = 'aborted',
  UNDEFINED = 'undefined',
}

export function otaPartitionStateFromBytes(
  data: Uint8Array,
): OtaPartitionState {
  const state = leBytesToU32(data);

  if (state === 0) return OtaPartitionState.NEW;
  if (state === 1) return OtaPartitionState.PENDING_VERIFY;
  if (state === 2) return OtaPartitionState.VALID;
  if (state === 3) return OtaPartitionState.INVALID;
  if (state === 4) return OtaPartitionState.ABORTED;
  if (state === 0xffffffff) return OtaPartitionState.UNDEFINED;

  throw new Error('Invalid state');
}

export function otaPartitionStateToBytes(
  otaPartitionState: OtaPartitionState,
): Uint8Array {
  if (otaPartitionState === OtaPartitionState.NEW) return u32ToLeBytes(0);
  if (otaPartitionState === OtaPartitionState.PENDING_VERIFY)
    return u32ToLeBytes(1);
  if (otaPartitionState === OtaPartitionState.VALID) return u32ToLeBytes(2);
  if (otaPartitionState === OtaPartitionState.INVALID) return u32ToLeBytes(3);
  if (otaPartitionState === OtaPartitionState.UNDEFINED)
    return new Uint8Array([0xff, 0xff, 0xff, 0xff]);

  throw new Error('Invalid state');
}
