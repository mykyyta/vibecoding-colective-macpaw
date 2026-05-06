export async function readProviderJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

export function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function throwProviderHttpError(
  provider: string,
  response: Response,
): Promise<never> {
  const body = asRecord(await readProviderJson(response));
  const message = getString(body?.error) ?? getString(asRecord(body?.error)?.message);

  throw new Error(
    `${provider} request failed with HTTP ${response.status}${message ? `: ${message}` : ""}`,
  );
}
