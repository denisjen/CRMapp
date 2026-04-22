import { ColumnId } from './types';

export const STALE_DAYS = 7;

export const COLUMNS: { id: ColumnId; label: string; color: string }[] = [
  { id: 'developing', label: '開發中', color: 'bg-blue-500' },
  { id: 'quoting',    label: '報價中', color: 'bg-yellow-500' },
  { id: 'closed',     label: '已成交', color: 'bg-green-500' },
];
