export function createUniqueChipValue(label: string, existingValues: string[]): string {
  const base = label
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'option';

  let candidate = base;
  let suffix = 2;

  while (existingValues.includes(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }

  return candidate;
}
