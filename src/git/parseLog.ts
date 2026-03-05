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


export function parseLog(limit: number, cwd?: string): Commit[] {

  const delimiter = '\x1f';
  const output = gitExec([
    'log',
    `-n ${limit}`,
    '--date=iso',
    `--pretty=format:%H${delimiter}%ad${delimiter}%an${delimiter}%s`
  ], cwd);

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


export function parseLogSinceDays(days: number, cwd?: string): Commit[] {
  const delimiter = '\x1f';
  const output = gitExec([
    'log',
    `--since="${days} days ago"`,
    '--date=iso',
    `--pretty=format:%H${delimiter}%ad${delimiter}%an${delimiter}%s`
  ], cwd);

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
