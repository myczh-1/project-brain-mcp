import * as fs from 'fs';
import * as path from 'path';
import { projectInit } from '@myczh/project-brain/core';
import { createFsStorage } from '@myczh/project-brain/infra-fs';

interface RepoFacts {
  cwd: string;
  repoRoot: string;
  isGitRepo: boolean;
  hasOpenSpec: boolean;
  hasBrainDir: boolean;
  hasManifest: boolean;
}

function parseArgs(argv: string[]): {
  command: 'setup' | 'doctor' | 'init' | 'stdio' | 'help';
  nonInteractive: boolean;
} {
  const args = argv.slice(2);
  const first = args[0];
  const command =
    first === 'setup' || first === 'doctor' || first === 'init' || first === 'stdio' || first === 'help' || first === '--help' || first === '-h'
      ? first
      : 'help';

  return {
    command: command === '--help' || command === '-h' ? 'help' : command,
    nonInteractive: args.includes('--yes') || args.includes('--non-interactive'),
  };
}

function detectRepoFacts(cwd = process.cwd()): RepoFacts {
  const storage = createFsStorage();
  const repoRoot = storage.getRepoRootPath(cwd);
  const openspecDir = path.join(repoRoot, 'openspec');
  const brainDir = path.join(repoRoot, '.project-brain');

  return {
    cwd,
    repoRoot,
    isGitRepo: repoRoot === path.resolve(cwd) ? fs.existsSync(path.join(repoRoot, '.git')) : true,
    hasOpenSpec: fs.existsSync(openspecDir),
    hasBrainDir: fs.existsSync(brainDir),
    hasManifest: storage.manifestExists(repoRoot),
  };
}

function printHeader(title: string): void {
  console.error('');
  console.error(title);
  console.error('='.repeat(title.length));
}

function printSetupSummary(facts: RepoFacts): void {
  console.error('Selected: Lightweight protocol mode');
  console.error('- AI tools read and write `.project-brain/` directly.');
  console.error('- Use `protocol/` as the contract for valid records.');
  if (facts.hasOpenSpec) {
    console.error('- OpenSpec detected, so this repository is ready for the recommended file-based workflow.');
  }
}

async function ensureBrainInitialized(facts: RepoFacts): Promise<void> {
  const storage = createFsStorage();
  storage.ensureBrainDir(facts.repoRoot);

  if (storage.manifestExists(facts.repoRoot)) {
    console.error(`Project Brain directory is ready at ${path.join(facts.repoRoot, '.project-brain')}`);
    return;
  }

  const inferredName = path.basename(facts.repoRoot);
  const result = await projectInit(
    {
      repo_path: facts.repoRoot,
      answers: {
        project_name: inferredName,
        summary: `Project Brain memory for ${inferredName}`,
        repo_type: 'application',
        primary_stack: ['unknown'],
      },
    },
    storage
  );

  console.error(result.message || 'Project Brain initialized.');
  if (result.manifest_path) {
    console.error(`Manifest created at ${result.manifest_path}`);
  }
}

function printLightweightInstructions(facts: RepoFacts): void {
  console.error('');
  console.error('Lightweight mode next steps');
  console.error('- Keep using your AI tool in this repository; it should read and write `.project-brain/` directly.');
  console.error('- Point the tool at `protocol/` when it needs the Project Brain contract.');
  if (facts.hasOpenSpec) {
    console.error('- OpenSpec detected: lightweight mode is the default recommendation for this repository.');
  }
  console.error('- Recommended prompt line: "Use Project Brain as the durable memory layer for this repository. When updating .project-brain/, follow the protocol/ contract."');
}

function printDoctorLine(label: string, ok: boolean, detail: string): void {
  console.error(`${ok ? 'OK' : 'WARN'}  ${label}: ${detail}`);
}

export async function runSetup(nonInteractive = false): Promise<void> {
  const facts = detectRepoFacts();

  printHeader('Project Brain Setup');
  console.error(`Repository: ${facts.repoRoot}`);
  console.error(`OpenSpec detected: ${facts.hasOpenSpec ? 'yes' : 'no'}`);
  console.error(`Existing .project-brain/: ${facts.hasBrainDir ? 'yes' : 'no'}`);

  console.error('');
  if (nonInteractive) {
    console.error('Running in non-interactive mode.');
  }
  printSetupSummary(facts);
  await ensureBrainInitialized(facts);
  printLightweightInstructions(facts);
}

export async function runDoctor(): Promise<void> {
  const facts = detectRepoFacts();
  const brainDir = path.join(facts.repoRoot, '.project-brain');
  const protocolDir = path.join(facts.repoRoot, 'protocol');

  printHeader('Project Brain Doctor');
  printDoctorLine('Repository root', true, facts.repoRoot);
  printDoctorLine('Git repository', facts.isGitRepo, facts.isGitRepo ? 'git metadata detected' : 'working outside a git repository');
  printDoctorLine('OpenSpec', facts.hasOpenSpec, facts.hasOpenSpec ? 'openspec/ is present' : 'openspec/ not found');
  printDoctorLine('.project-brain', facts.hasBrainDir, facts.hasBrainDir ? brainDir : 'directory not created yet');
  printDoctorLine('Manifest', facts.hasManifest, facts.hasManifest ? 'manifest.json is present' : 'manifest.json not found');
  printDoctorLine('Protocol docs', fs.existsSync(protocolDir), fs.existsSync(protocolDir) ? 'protocol/ is present' : 'protocol/ not found');

  console.error('');
  console.error('Suggested next step:');
  if (!facts.hasBrainDir) {
    console.error('- Run `project-brain setup` to initialize Project Brain for this repository.');
  } else if (facts.hasOpenSpec) {
    console.error('- Keep using the OpenSpec + Project Brain file-based workflow in this repository.');
  } else {
    console.error('- Point your AI tool at `protocol/` and let it update `.project-brain/` directly.');
  }
}

export async function runInit(): Promise<void> {
  const facts = detectRepoFacts();
  printHeader('Project Brain Init');
  await ensureBrainInitialized(facts);
  console.error('- Next: run `project-brain setup` for mode-specific guidance.');
}

export function printHelp(): void {
  console.error('Project Brain');
  console.error('');
  console.error('Usage:');
  console.error('  project-brain setup           Initialize .project-brain/ and print file-based workflow guidance');
  console.error('  project-brain doctor          Check repository readiness for the file-based workflow');
  console.error('  project-brain init            Initialize .project-brain/ with a minimal manifest');
  console.error('  project-brain stdio           Run the runtime tool surface over newline-delimited JSON on stdin/stdout');
  console.error('  project-brain help            Show this help');
}

export function parseCliArgs(argv: string[]) {
  return parseArgs(argv);
}
