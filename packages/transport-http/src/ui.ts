import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// Static assets live at packages/transport-http/static/.
// At runtime the compiled JS sits in dist/packages/transport-http/src/,
// so we walk up four levels to reach the repo root, then back down.
const staticDir = resolve(here, '..', '..', '..', '..', 'packages', 'transport-http', 'static');

const cachedHtml = readFileSync(resolve(staticDir, 'index.html'), 'utf-8');
const cachedCss = readFileSync(resolve(staticDir, 'styles.css'), 'utf-8');
const cachedJs = readFileSync(resolve(staticDir, 'app.js'), 'utf-8');

export function renderUiHtml(): string {
  return cachedHtml;
}

export function renderUiCss(): string {
  return cachedCss;
}

export function renderUiJs(): string {
  return cachedJs;
}
