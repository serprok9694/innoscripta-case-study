import { http, HttpResponse } from 'msw';
import { server } from './server';

/**
 * Responds to GET requests ending in `path` with `body` and records every request URL,
 * so tests can assert on the query params an adapter sent.
 */
export function mockJson(path: string, body: unknown, init: { status?: number } = {}): URL[] {
  const requests: URL[] = [];
  server.use(
    http.get(`*${path}`, ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(body as Record<string, unknown>, init);
    }),
  );
  return requests;
}
