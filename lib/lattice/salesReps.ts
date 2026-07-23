export const SALES_REPS: string[] = [
  "Jordan Lee",
  "Morgan Reyes",
  "Casey Kim",
  "Avery Brooks",
  "Riley Chen",
  "Taylor Osei",
  "Sam Whitfield",
  "Drew Alvarez",
];

export function buildRepLabel(name: string): string {
  return `${name} · Sales Rep`;
}
