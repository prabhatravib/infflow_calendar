export const CALENDAR_ID = "3c414e29-a3c3-4350-a334-5585cb22737a";

export const DEFAULT_TIMEZONE = "America/New_York";

export const EVENT_TYPES = {
  REGULAR: 'regular',
  ECHO: 'echo',
  OTHER: 'other'
} as const;

export const CACHE_HEADERS = {
  NO_CACHE: 'no-cache, no-store, must-revalidate',
  PRAGMA: 'no-cache',
  EXPIRES: '0'
} as const;
