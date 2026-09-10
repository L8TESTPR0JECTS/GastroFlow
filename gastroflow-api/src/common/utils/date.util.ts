const defaultTimeZone = 'America/New_York';

export function nowIso(): string {
  return new Date().toISOString();
}

export function addDaysIso(dateIso: string, days: number): string {
  const date = new Date(dateIso);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString();
}

export function getDefaultTimeZone(): string {
  return process.env.APP_TIMEZONE ?? defaultTimeZone;
}

export function resolveTimeZone(timezone?: string): string {
  const resolvedTimeZone = timezone ?? getDefaultTimeZone();

  assertValidTimeZone(resolvedTimeZone);

  return resolvedTimeZone;
}

export function formatIsoInTimeZone(
  dateIso: string,
  timezone?: string
): string {
  const resolvedTimeZone = resolveTimeZone(timezone);
  const date = new Date(dateIso);
  const parts = getZonedDateParts(date, resolvedTimeZone);
  const offsetMinutes = getTimeZoneOffsetMinutes(date, resolvedTimeZone);

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}${formatOffset(offsetMinutes)}`;
}

export function getZonedDateParts(
  date: Date,
  timezone?: string
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const resolvedTimeZone = resolveTimeZone(timezone);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: resolvedTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  });
  const values = formatter.formatToParts(date).reduce<Record<string, string>>(
    (summary, part) => {
      if (part.type !== 'literal') {
        summary[part.type] = part.value;
      }

      return summary;
    },
    {}
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second)
  };
}

export function createUtcIsoFromZonedDateTime(input: {
  timezone?: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
  second?: number;
}): string {
  const resolvedTimeZone = resolveTimeZone(input.timezone);
  const utcGuessMs = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute ?? 0,
    input.second ?? 0
  );
  const firstOffsetMinutes = getTimeZoneOffsetMinutes(
    new Date(utcGuessMs),
    resolvedTimeZone
  );
  const firstUtcMs = utcGuessMs - firstOffsetMinutes * 60 * 1000;
  const secondOffsetMinutes = getTimeZoneOffsetMinutes(
    new Date(firstUtcMs),
    resolvedTimeZone
  );
  const finalUtcMs = utcGuessMs - secondOffsetMinutes * 60 * 1000;

  return new Date(finalUtcMs).toISOString();
}

export function addDaysToZonedDateParts(input: {
  year: number;
  month: number;
  day: number;
  days: number;
}): {
  year: number;
  month: number;
  day: number;
} {
  const date = new Date(Date.UTC(input.year, input.month - 1, input.day));

  date.setUTCDate(date.getUTCDate() + input.days);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

function assertValidTimeZone(timezone: string): void {
  new Intl.DateTimeFormat('en-US', { timeZone: timezone });
}

function getTimeZoneOffsetMinutes(date: Date, timezone: string): number {
  const parts = getZonedDatePartsWithoutValidation(date, timezone);
  const zonedUtcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return Math.round((zonedUtcMs - date.getTime()) / 60000);
}

function getZonedDatePartsWithoutValidation(
  date: Date,
  timezone: string
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  });
  const values = formatter.formatToParts(date).reduce<Record<string, string>>(
    (summary, part) => {
      if (part.type !== 'literal') {
        summary[part.type] = part.value;
      }

      return summary;
    },
    {}
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second)
  };
}

function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;

  return `${sign}${pad(hours)}:${pad(minutes)}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
