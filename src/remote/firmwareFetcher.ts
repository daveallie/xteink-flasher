'use server';

const officialFirmwareUrls = {
  '3.1.1-EN':
    'http://gotaserver.xteink.com/api/download/ESP32C3/V3.1.1/V3.1.1-EN.bin',
  '3.1.4-CH':
    'http://47.122.74.33:5000/api/download/ESP32C3/V3.1.4/V3.1.4-CH-X4.bin',
};

export async function getOfficialFirmware(
  version: keyof typeof officialFirmwareUrls,
) {
  const url = officialFirmwareUrls[version];

  const response = await fetch(url);
  return new Uint8Array(await response.arrayBuffer());
}

export async function getCommunityFirmware(firmware: 'CrossPoint') {
  if (firmware === 'CrossPoint') {
    const releaseData = await fetch(
      'https://api.github.com/repos/daveallie/crosspoint-reader/releases/latest',
    ).then((resp) => resp.json());

    const firmwareAsset = releaseData.assets.find((asset: any) =>
      asset.name.endsWith('firmware.bin'),
    );
    if (!firmwareAsset) {
      throw new Error('CrossPoint firmware asset not found');
    }
    const url: string = firmwareAsset.browser_download_url;
    const response = await fetch(url);
    return new Uint8Array(await response.arrayBuffer());
  }

  throw new Error('Unsupported community firmware');
}
