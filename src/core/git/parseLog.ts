import { gitExec } from './gitExec.js';

export interface Commit {
  hash: string;
  time: string;
  author: string;
  message: string;
  tag: 'feat' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore' | 'other';
  files_changed_count: number;
}


function classifyCommit(message: string): Commit['tag'] {
  const lower = message.toLowerCase();
  
  if (lower.startsWith('feat:') || lower.startsWith('feat(')) return 'feat';
  if (lower.startsWith('fix:') || lower.startsWith('fix(')) return 'fix';
  if (lower.startsWith('refactor:') || lower.startsWith('refactor(')) return 'refactor';
  if (lower.startsWith('docs:') || lower.startsWith('docs(')) return 'docs';
  if (lower.startsWith('test:') || lower.startsWith('test(')) return 'test';
  if (lower.startsWith('chore:') || lower.startsWith('chore(')) return 'chore';
  
  return 'other';
}

function isMissingHistoryError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('not a git repository') ||
    message.includes('does not have any commits yet') ||
    message.includes('your current branch')
  );
}

function parseLogWithArgs(args: string[], cwd?: string): Commit[] {
  const delimiter = '\x1f';

  let output = '';
  try {
    output = gitExec(args, cwd);
  } catch (error) {
    if (isMissingHistoryError(error)) {
      return [];
    }
    throw error;
  }

  if (!output) return [];

  const lines = output.split('\n');
  const commits: Commit[] = [];

  for (const line of lines) {
    const parts = line.split(delimiter);
    if (parts.length < 4) continue;

    const [hash, time, author, message] = parts;

    let filesChangedCount = 0;
    try {
      const filesOutput = gitExec(['show', '--name-only', '--pretty=format:', hash], cwd);
      filesChangedCount = filesOutput.split('\n').filter(f => f.trim()).length;
    } catch {
      filesChangedCount = 0;
    }

    commits.push({
      hash,
      time,
      author,
      message,
      tag: classifyCommit(message),
      files_changed_count: filesChangedCount,
    });
  }

  return commits;
}


export function parseLog(limit: number, cwd?: string): Commit[] {
  const delimiter = '\x1f';
  return parseLogWithArgs(
    [
      'log',
      `-n ${limit}`,
      '--date=iso',
      `--pretty=format:%H${delimiter}%ad${delimiter}%an${delimiter}%s`,
    ],
    cwd
  );
}


export function parseLogSinceDays(days: number, cwd?: string): Commit[] {
  const delimiter = '\x1f';
  return parseLogWithArgs(
    [
      'log',
      `--since="${days} days ago"`,
      '--date=iso',
      `--pretty=format:%H${delimiter}%ad${delimiter}%an${delimiter}%s`,
    ],
    cwd
  );
}
