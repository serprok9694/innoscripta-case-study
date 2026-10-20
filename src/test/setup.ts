import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw/server';

/** Most tests run in jsdom; a few (e.g. config checks) run in plain Node. */
const hasDom = typeof window !== 'undefined';

if (hasDom) {
  // jsdom doesn't implement modal dialogs or scrolling yet.
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
  window.scrollTo = () => {};
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  if (!hasDom) return;
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  document.documentElement.className = '';
});
afterAll(() => server.close());
