// Applies the saved theme before the first paint to avoid a light flash.
// A file rather than an inline script, so the Content-Security-Policy can
// stay at script-src 'self'. Mirrors src/features/theme (storage key and
// "system" fallback).
(function () {
  try {
    var mode = localStorage.getItem('news-aggregator:theme');
    var dark =
      mode === 'dark' ||
      (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch {
    // Storage or matchMedia unavailable: keep the default (light) theme.
  }
})();
