import React from 'react';
import cn from 'classnames';
import { ScrollArea } from '@chakra-ui/react';
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
  variant = 'default',
}: {
  data: number;
  variant?: 'default' | 'header' | 'muted';
}) {
  return (
    <span className={cn(styles.hexCell, styles[`hexCell-${variant}`])}>
      {data.toString(16).padStart(2, '0')}
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
          variant={variant ?? (d === 0 ? 'muted' : 'default')}
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
    </div>
  );
}

export default function HexViewer({ data }: { data: Uint8Array }) {
  const addressWidth = 4;
  const groupedData = chunk([...data], 16);

  return (
    <div className={styles.view}>
      <ScrollArea.Root>
        <ScrollArea.Viewport>
          <ScrollArea.Content
            scrollSnapStrictness="mandatory"
            scrollSnapType="y"
          >
            <HeaderRow addressWidth={addressWidth} />
            {groupedData.map((group, i) => (
              <DataRow
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                addressWidth={addressWidth}
                address={i * 16}
                data={group}
              />
            ))}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar>
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner />
      </ScrollArea.Root>
    </div>
  );
}
