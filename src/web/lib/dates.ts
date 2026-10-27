const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "04-13" → "13 Apr" */
export function formatMonthDay(md: string) {
  const [m, d] = md.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export const MONTH_NAMES = MONTHS;
export const daysInMonth = (month: number) => new Date(2024, month, 0).getDate(); // leap year so Feb 29 is allowed
