import React from 'react';
import cn from 'classnames';
import { List, RowComponentProps } from 'react-window';
import styles from './styles.module.css';

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
    <span className={cn(styles.asciiCell, styles[`asciiCell-${v}`])}>
      {knownChar ? String.fromCharCode(data) : '.'}
    </span>
  );
}

function HexRow({
  data,
  variant,
}: {
  data: Uint8Array;
  variant?: 'default' | 'header' | 'muted';
}) {
  return (
    <div>
      {[...data].map((d, i) => (
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
  data: Uint8Array;
  variant?: 'default' | 'header' | 'muted';
}) {
  return (
    <div>
      {[...data].map((d, i) => (
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
        data={
          new Uint8Array([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0xa, 0xb, 0xc, 0xd, 0xe, 0xf,
          ])
        }
        variant="header"
      />
      <div>
        <span className={cn(styles.hexCell, styles.hiddenData)}>0</span>
      </div>
      <AsciiRow
        data={
          new Uint8Array(['A', 'S', 'C', 'I', 'I'].map((c) => c.charCodeAt(0)))
        }
        variant="header"
      />
    </div>
  );
}

function DataRow({
  allData,
  addressWidth,
  index,
  style,
}: RowComponentProps<{
  allData: Uint8Array;
  addressWidth: number;
}>) {
  const address = index * 16;

  return (
    <div className={styles.row} style={style}>
      <div>
        <span className={cn(styles.hexCell, styles['hexCell-header'])}>
          {address.toString(16).padStart(addressWidth, '0')}
        </span>
      </div>
      <HexRow data={allData.slice(index * 16, (index + 1) * 16)} />
      <div>
        <span className={cn(styles.hexCell, styles.hiddenData)}>0</span>
      </div>
      <AsciiRow data={allData.slice(index * 16, (index + 1) * 16)} />
    </div>
  );
}

export default function HexViewer({ data }: { data: Uint8Array }) {
  const addressWidth = Math.max((data.length - 1).toString(16).length, 2);

  return (
    <div>
      <HeaderRow addressWidth={addressWidth} />
      <List
        rowComponent={DataRow}
        rowCount={Math.ceil(data.length / 16)}
        rowHeight={24}
        rowProps={{ allData: data, addressWidth }}
        className={styles.view}
        style={{ height: 24 * 20 }}
      />
    </div>
  );
}
