import { execFileSync } from 'node:child_process';

/**
 * Playwright stops the web server process abruptly, so `docker run` can't pass
 * the signal on to the container: remove it explicitly, so the next run
 * builds and tests a fresh image instead of reusing a stale one.
 */
export default function globalTeardown() {
  if (process.env.E2E_BASE_URL) return; // an app someone else started
  try {
    execFileSync('docker', ['rm', '-f', 'newsroom-e2e'], { stdio: 'ignore' });
  } catch {
    // Already gone.
  }
}
