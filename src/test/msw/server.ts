import { setupServer } from 'msw/node';

/**
 * Shared MSW server for tests. Handlers are registered per test via
 * `server.use(...)`; any unhandled request fails the test.
 */
export const server = setupServer();
