export function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toLocalDateKey(input?: string): string {
  if (!input) {
    return formatLocalDateKey(new Date());
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    return input.slice(0, 10);
  }

  const mmddyyyyMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return formatLocalDateKey(new Date());
  }

  return formatLocalDateKey(parsed);
}

export function parseLocalDate(input?: string): Date {
  if (!input) {
    return new Date();
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    const [year, month, day] = input.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const mmddyyyyMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}
