export const TABLE_STATUS = {
  FREE: 'free',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
} as const

export type TableStatus = typeof TABLE_STATUS[keyof typeof TABLE_STATUS]

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  [TABLE_STATUS.FREE]: 'Свободен',
  [TABLE_STATUS.OCCUPIED]: 'Занят',
  [TABLE_STATUS.RESERVED]: 'Резерв',
}

export const TABLE_STATUS_COLORS: Record<TableStatus, string> = {
  [TABLE_STATUS.FREE]: 'bg-emerald-500',
  [TABLE_STATUS.OCCUPIED]: 'bg-red-500',
  [TABLE_STATUS.RESERVED]: 'bg-amber-500',
}

export const TABLE_CARD_COLORS: Record<TableStatus, string> = {
  [TABLE_STATUS.FREE]: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100',
  [TABLE_STATUS.OCCUPIED]: 'border-red-200 bg-red-50 hover:bg-red-100',
  [TABLE_STATUS.RESERVED]: 'border-amber-200 bg-amber-50',
}
