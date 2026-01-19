'use server';

import { getCache } from '@vercel/functions';

interface OfficialFirmwareData {
  change_log: string;
  download_url: string;
  version: string;
}

interface OfficialFirmwareVersions {
  en: OfficialFirmwareData;
  ch: OfficialFirmwareData;
}

interface CommunityFirmwareVersions {
  crossPoint: {
    version: string;
    releaseDate: string;
    downloadUrl: string;
  };
}

const firmwareVersionFallback: OfficialFirmwareVersions = {
  en: {
    change_log:
      '1. Optimize EPUB/TXT  \r\n2. Optimize JPG speed  \r\n3. Optimize Wi-Fi connection  \r\n4. Optimize EPUB covers',
    download_url:
      'http://gotaserver.xteink.com/api/download/ESP32C3/V3.1.1/V3.1.1-EN.bin',
    version: 'V3.1.1',
  },
  ch: {
    change_log:
      '1.优化蓝牙卡死\r\n2.优化epub,阻止打开加密书籍\r\n3.优化文件时间写入逻辑\r\n4.调整XTC/XTCH用的灰度波形\r\n5.需重建索引',
    download_url:
      'http://47.122.74.33:5000/api/download/ESP32C3/V3.1.9/V3.1.9_CH_X4_0117.bin',
    version: 'V3.1.9',
  },
};

const chineseFirmwareCheckUrl =
  'http://47.122.74.33:5000/api/check-update?current_version=V3.0.1&device_type=ESP32C3';
const englishFirmwareCheckUrl =
  'http://gotaserver.xteink.com/api/check-update?current_version=V3.0.1&device_type=ESP32C3&device_id=1234';

export async function getOfficialFirmwareRemoteData(): Promise<OfficialFirmwareVersions> {
  const cache = getCache();
  const cacheKey = 'firmware-versions.official.v1';

  const value = (await cache.get(cacheKey)) as OfficialFirmwareVersions | null;
  if (value) {
    return value;
  }

  return Promise.all([
    fetch(chineseFirmwareCheckUrl),
    fetch(englishFirmwareCheckUrl),
  ])
    .then(([chRes, enRes]) => Promise.all([chRes.json(), enRes.json()]))
    .then(async ([chData, enData]) => {
      const data: OfficialFirmwareVersions = {
        en: enData.data,
        ch: chData.data,
      };

      await cache.set(cacheKey, data, {
        ttl: 60 * 60 * 24, // 24 hours
      });

      return data;
    })
    .catch(() => firmwareVersionFallback);
}

export async function getOfficialFirmwareVersions() {
  const data = await getOfficialFirmwareRemoteData();

  return {
    en: data.en.version,
    ch: data.ch.version,
  };
}

export async function getCommunityFirmwareRemoteData(): Promise<CommunityFirmwareVersions> {
  const cache = getCache();
  const cacheKey = 'firmware-versions.community.v1';

  const value = (await cache.get(cacheKey)) as CommunityFirmwareVersions | null;
  if (value) {
    return value;
  }

  const releaseData = await fetch(
    'https://api.github.com/repos/daveallie/crosspoint-reader/releases/latest',
  ).then((resp) => resp.json());

  const firmwareAsset = releaseData.assets.find((asset: any) =>
    asset.name.endsWith('firmware.bin'),
  );
  if (!firmwareAsset) {
    throw new Error('CrossPoint firmware asset not found');
  }

  const data = {
    crossPoint: {
      version: releaseData.tag_name,
      releaseDate: new Date(releaseData.published_at)
        .toISOString()
        .slice(0, 10),
      downloadUrl: firmwareAsset.browser_download_url,
    },
  };

  await cache.set(cacheKey, data, {
    ttl: 60 * 60, // 1 hour
  });

  return data;
}

export async function getOfficialFirmware(region: 'en' | 'ch') {
  const url = await getOfficialFirmwareRemoteData().then(
    (data) => data[region].download_url,
  );
  const response = await fetch(url);
  return new Uint8Array(await response.arrayBuffer());
}

export async function getCommunityFirmware(_firmware: 'CrossPoint') {
  const releaseData = await getCommunityFirmwareRemoteData().then(
    (data) => data.crossPoint,
  );

  const response = await fetch(releaseData.downloadUrl);
  return new Uint8Array(await response.arrayBuffer());
}
