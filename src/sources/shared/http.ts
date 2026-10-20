import type { z } from 'zod';
import type { SourceId } from '@/domain/article';
import { SourceError } from './source-error';

export type QueryParams = Record<string, string | number | undefined>;

/** URL of the local key-injecting proxy for a source (see server/api-sources.ts). */
export function proxyUrl(sourceId: SourceId, path: string, params: QueryParams = {}): string {
  const url = new URL(`/api/${sourceId}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * GETs JSON and validates it against `schema`. Every failure except an abort
 * becomes a `SourceError`, so callers handle a single error type.
 */
export async function fetchJson<Schema extends z.ZodType>(
  sourceId: SourceId,
  url: string,
  schema: Schema,
  signal?: AbortSignal,
): Promise<z.output<Schema>> {
  let response: Response;
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new SourceError(sourceId, 'network', 'Network error', undefined, { cause: error });
  }

  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const kind = response.status === 429 ? 'rate-limit' : 'http';
    const message = extractErrorMessage(body) ?? `Request failed with status ${response.status}`;
    throw new SourceError(sourceId, kind, message, response.status);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new SourceError(sourceId, 'invalid-response', 'Unexpected response format', undefined, {
      cause: parsed.error,
    });
  }
  return parsed.data;
}

/** Error message from any of the supported APIs' error payloads. */
function extractErrorMessage(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const b = body as {
    message?: unknown;
    response?: { message?: unknown };
    fault?: { faultstring?: unknown };
  };
  const message = b.message ?? b.response?.message ?? b.fault?.faultstring;
  return typeof message === 'string' ? message : undefined;
}
