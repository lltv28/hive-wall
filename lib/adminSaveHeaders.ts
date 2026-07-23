export function buildConfigSaveHeaders(configWriteToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = configWriteToken?.trim();
  if (token) {
    headers['x-config-write-token'] = token;
  }

  return headers;
}
