import { nowIso } from './date.util';

export function createAuditTimestamps(): {
  createdAt: string;
  updatedAt: string;
} {
  const timestamp = nowIso();

  return {
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createUpdatedAtTimestamp(): {
  updatedAt: string;
} {
  return {
    updatedAt: nowIso(),
  };
}