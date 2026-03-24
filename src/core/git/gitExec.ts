import { execSync } from 'child_process';

/**
 * Execute git command and return output
 */
export function gitExec(args: string[], cwd?: string): string {
  try {
    const result = execSync(`git ${args.join(' ')}`, {
      cwd: cwd || process.cwd(),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim();
  } catch (error: any) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}

/**
 * Get repository root path
 */
export function getRepoRoot(cwd?: string): string {
  return gitExec(['rev-parse', '--show-toplevel'], cwd);
}

/**
 * Check if directory is a git repository
 */
export function isGitRepo(cwd?: string): boolean {
  try {
    gitExec(['rev-parse', '--git-dir'], cwd);
    return true;
  } catch {
    return false;
  }
}
