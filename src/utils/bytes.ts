/* eslint-disable no-bitwise */

export function u32ToLeBytes(u32: number) {
  return new Uint8Array([
    u32 & 0xff,
    (u32 >> 8) & 0xff,
    (u32 >> 16) & 0xff,
    (u32 >> 24) & 0xff,
  ]);
}

export function leBytesToU32(bytes: Uint8Array) {
  return (
    (bytes.at(0) ?? 0) +
    ((bytes.at(1) ?? 0) << 8) +
    ((bytes.at(2) ?? 0) << 16) +
    ((bytes.at(3) ?? 0) << 24)
  );
}
