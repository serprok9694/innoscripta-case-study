import type { SourceId } from '@/domain/article';

export type SourceErrorKind = 'network' | 'http' | 'rate-limit' | 'invalid-response';

/** A failed request to one news source. Other sources keep working. */
export class SourceError extends Error {
  override readonly name = 'SourceError';
  readonly sourceId: SourceId;
  readonly kind: SourceErrorKind;
  readonly status?: number;

  constructor(
    sourceId: SourceId,
    kind: SourceErrorKind,
    message: string,
    status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.sourceId = sourceId;
    this.kind = kind;
    this.status = status;
  }
}
