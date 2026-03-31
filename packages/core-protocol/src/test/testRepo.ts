import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export function createTempDir(prefix: string): string {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

export function createTempRepoRoot(prefix: string): string {
  const root = createTempDir(prefix);
  execFileSync('git', ['init', '-q'], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
  return root;
}

export function createNestedDir(root: string, ...segments: string[]): string {
  const directory = path.join(root, ...segments);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

export function cleanupTempRepoRoot(root: string): void {
  fs.rmSync(root, { recursive: true, force: true });
}
