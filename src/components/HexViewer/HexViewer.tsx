import React from 'react';
import cn from 'classnames';
import styles from './styles.module.css';

function chunk<T>(input: T[], size: number) {
  return input.reduce<T[][]>(
    (arr, item, idx) =>
      idx % size === 0
        ? [...arr, [item]]
        : [...arr.slice(0, -1), [...(arr.slice(-1)[0] ?? []), item]],
    [],
  );
}

function HexCell({
  data,
  variant,
}: {
  data: number;
  variant?: 'default' | 'header' | 'muted';
}) {
  const v = variant ?? (data === 0 ? 'muted' : 'default');

  return (
    <span className={cn(styles.hexCell, styles[`hexCell-${v}`])}>
      {data.toString(16).padStart(2, '0')}
    </span>
  );
}

function AsciiCell({
  data,
  variant,
}: {
  data: number;
  variant?: 'default' | 'header' | 'muted';
}) {
  const knownChar = data >= 32 && data <= 126;
  const v = variant ?? (knownChar ? 'default' : 'muted');

  return (
    <span className={cn(styles.hexCell, styles[`hexCell-${v}`])}>
      {knownChar ? String.fromCharCode(data) : '.'}
    </span>
  );
}

function HexRow({
  data,
  variant,
}: {
  data: number[];
  variant?: 'default' | 'header' | 'muted';
}) {
  return (
    <div>
      {data.map((d, i) => (
        <HexCell
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          data={d}
          variant={variant}
        />
      ))}
    </div>
  );
}

function AsciiRow({
  data,
  variant,
}: {
  data: number[];
  variant?: 'default' | 'header' | 'muted';
}) {
  return (
    <div>
      {data.map((d, i) => (
        <AsciiCell
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          data={d}
          variant={variant}
        />
      ))}
    </div>
  );
}

function HeaderRow({ addressWidth }: { addressWidth: number }) {
  return (
    <div className={cn(styles.row, styles.stickyHeader)}>
      <div>
        <span className={cn(styles.hexCell, styles.hiddenData)}>
          {'0'.padStart(addressWidth, '0')}
        </span>
      </div>
      <HexRow
        data={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0xa, 0xb, 0xc, 0xd, 0xe, 0xf]}
        variant="header"
      />
      <div>
        <span className={cn(styles.hexCell, styles.hiddenData)}>0</span>
      </div>
      <AsciiRow
        data={['A', 'S', 'C', 'I', 'I'].map((c) => c.charCodeAt(0))}
        variant="header"
      />
    </div>
  );
}

function DataRow({
  address,
  addressWidth,
  data,
}: {
  address: number;
  addressWidth: number;
  data: number[];
}) {
  return (
    <div className={styles.row}>
      <div>
        <span className={cn(styles.hexCell, styles['hexCell-header'])}>
          {address.toString(16).padStart(addressWidth, '0')}
        </span>
      </div>
      <HexRow data={data} />
      <div>
        <span className={cn(styles.hexCell, styles.hiddenData)}>0</span>
      </div>
      <AsciiRow data={data} />
    </div>
  );
}

export default function HexViewer({ data }: { data: Uint8Array }) {
  const addressWidth = 4;
  const groupedData = chunk([...data], 16);

  return (
    <div>
      <HeaderRow addressWidth={addressWidth} />
      <div className={styles.view} style={{ height: 24 * 20 }}>
        {groupedData.map((group, i) => (
          <DataRow
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            addressWidth={addressWidth}
            address={i * 16}
            data={group}
          />
        ))}
      </div>
    </div>
  );
}
