export interface FirmwareInfo {
  type: 'official-english' | 'official-chinese' | 'crosspoint' | 'unknown';
  version: string;
  displayName: string;
}

/**
 * Find a string in binary data and return its offset, or -1 if not found
 */
function findString(
  data: Uint8Array,
  searchString: string,
  startOffset = 0,
): number {
  const encoder = new TextEncoder();
  const searchBytes = encoder.encode(searchString);

  if (data.length < searchBytes.length) {
    return -1;
  }

  for (let i = startOffset; i <= data.length - searchBytes.length; i += 1) {
    let match = true;
    for (let j = 0; j < searchBytes.length; j += 1) {
      if (data[i + j] !== searchBytes[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      return i;
    }
  }

  return -1;
}

/**
 * Validate ESP32 firmware image structure
 */
function isValidEsp32Image(data: Uint8Array): boolean {
  if (data.length < 0x24) {
    return false;
  }

  // Check ESP32 image magic byte at offset 0
  const imageMagic = data[0];
  if (imageMagic !== 0xe9) {
    return false;
  }

  // Check app descriptor magic at offset 0x20
  const view = new DataView(data.buffer, data.byteOffset);
  const descriptorMagic = view.getUint32(0x20, true); // little-endian
  if (descriptorMagic !== 0xabcd5432) {
    return false;
  }

  return true;
}

/**
 * Extract version string from firmware binary
 * Looks for V*.*.* pattern in official firmwares, and numeric patterns for community firmwares
 *
 * @param data - The firmware binary data
 * @param searchLimit - How many bytes to search (default 25KB)
 * @returns Version string or 'unknown' if not found
 */
function extractVersion(data: Uint8Array, searchLimit = 25000): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const searchArea = data.slice(0, Math.min(data.length, searchLimit));

  // Try to find V-pattern versions (official firmware)
  // Pattern: [any byte]<V3.1.1 or similar
  for (let i = 0; i < searchArea.length - 8; i += 1) {
    if (searchArea[i] === 0x56) {
      // 'V' character
      const chunk = decoder.decode(
        searchArea.slice(i, Math.min(i + 10, searchArea.length)),
      );
      const match = chunk.match(/V\d+\.\d+\.\d+/);
      if (match) {
        return match[0];
      }
    }
  }

  // Try to find numeric versions (CrossPoint: 0.12.0, etc.)
  try {
    const fullString = decoder.decode(searchArea);

    // Check for CrossPoint-ESP32-x.x.x pattern
    const crossPointMatch = fullString.match(
      /CrossPoint-ESP32-(\d+\.\d+\.\d+)/,
    );
    if (crossPointMatch) {
      return crossPointMatch[1]!;
    }

    // eslint-disable-next-line no-control-regex
    const lines = fullString.split(/[\x00\n]/);
    // eslint-disable-next-line no-restricted-syntax
    for (const line of lines) {
      const match = line.match(/^\d+\.\d+\.\d+$/);
      if (match) {
        return match[0];
      }
    }

    // Also search for version in common patterns
    const versionMatch = fullString.match(/(?:Version[:\s]*)(\d+\.\d+\.\d+)/i);
    if (versionMatch?.[1]) {
      return versionMatch[1];
    }
  } catch {
    // Decoding failed, continue
  }

  return 'unknown';
}

/**
 * Identify firmware type and extract version information
 * Uses XTOS proximity check as the sole discriminator for official firmwares
 * Unfortunately, inherently brittle, due to potential changes to the official firmware.
 *
 * Detection strategy:
 * 1. Validate ESP32 image structure
 * 2. Find version string (V3.x.x pattern)
 * 3. Check what appears after the version:
 *    - If "XTOS " appears within 50 bytes → Chinese firmware
 *    - If no "XTOS " and valid ESP32 image → English firmware
 * 4. Check for CrossPoint patterns
 *
 * @param firmwareData - The raw firmware binary data
 * @returns FirmwareInfo object with type, version, and display name
 */
export function identifyFirmware(firmwareData: Uint8Array): FirmwareInfo {
  // Validate it's a real ESP32 firmware image
  const isValidImage = isValidEsp32Image(firmwareData);

  // Search in first 25KB for version
  const searchLimit = 25000;
  const searchArea = firmwareData.slice(
    0,
    Math.min(firmwareData.length, searchLimit),
  );

  // Try to find version string
  const version = extractVersion(searchArea);
  const hasVersion = version !== 'unknown';

  // Find version location for proximity checks (only if we found a version)
  const versionOffset = hasVersion ? findString(searchArea, version) : -1;

  // Check for official firmwares using XTOS proximity
  if (versionOffset !== -1 && version.startsWith('V') && isValidImage) {
    // Check area around version (50 bytes before and after) for XTOS indicator
    const startOffset = Math.max(0, versionOffset - 50);
    const endOffset = Math.min(
      searchArea.length,
      versionOffset + version.length + 50,
    );
    const areaAroundVersion = searchArea.slice(startOffset, endOffset);

    // Chinese firmware has "XTOS" nearby version
    if (findString(areaAroundVersion, 'XTOS') !== -1) {
      return {
        type: 'official-chinese',
        version,
        displayName: 'Official Chinese',
      };
    }

    // English firmware has NO XTOS around version
    // If we have a V-pattern version, valid ESP32 image, but no XTOS → English
    return {
      type: 'official-english',
      version,
      displayName: 'Official English',
    };
  }

  // Check for CrossPoint Community firmware
  if (
    findString(firmwareData, 'CrossPoint-ESP32-') !== -1 ||
    findString(firmwareData, 'Starting CrossPoint version') !== -1
  ) {
    return {
      type: 'crosspoint',
      version,
      displayName: 'CrossPoint Community Reader',
    };
  }

  // Unknown firmware
  return {
    type: 'unknown',
    version,
    displayName: 'Custom/Unknown Firmware',
  };
}

/**
 * Check if identification was successful (found a known firmware type)
 * Returns false only for "unknown" firmware type
 *
 * @param info - The FirmwareInfo result
 * @returns true if firmware type was identified, false if unknown
 */
export function isIdentificationSuccessful(info: FirmwareInfo): boolean {
  return info.type !== 'unknown';
}
