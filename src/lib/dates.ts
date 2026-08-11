export function todayInputValue(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function dateFromInput(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

export function dateToInput(value: Date): string {
  return value.toISOString().slice(0, 10);
}
