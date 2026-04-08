import * as fs from 'fs';
import * as path from 'path';
import { projectInit } from '@myczh/project-brain/core';
import { createFsStorage } from '@myczh/project-brain/infra-fs';
import { ensureRepoAgentsFile } from './agents.js';

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
  console.error('Selected: Bootstrap mode');
  console.error('- This CLI bootstraps `.project-brain/` and writes repository-local `AGENTS.md` guidance for Project Brain.');
  console.error('- Tool installation is only complete after your AI tool config is updated to use `project-brain stdio`.');
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

function ensureAgentsGuidance(facts: RepoFacts): void {
  const agentsPath = ensureRepoAgentsFile(facts.repoRoot);
  console.error(`Repository guidance updated at ${agentsPath}`);
}

function printLightweightInstructions(facts: RepoFacts): void {
  console.error('');
  console.error('Bootstrap next steps');
  console.error('- Open `docs/install.md` and ask your AI assistant to connect your chosen AI tool to `project-brain stdio`.');
  console.error('- The assistant should ask which AI tool to configure, then apply the closest supported persistent MCP/tool configuration for that tool.');
  console.error('- Repository-local Project Brain guidance now lives in `AGENTS.md` and can be checked into version control.');
  console.error('- Tool installation is not complete until your AI tool is configured to use `project-brain stdio`.');
  if (facts.hasOpenSpec) {
    console.error('- OpenSpec detected: the installer should preserve the OpenSpec + Project Brain workflow.');
  }
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
  ensureAgentsGuidance(facts);
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
  } else {
    console.error('- Ask your AI assistant to follow `docs/install.md` for the final AI tool integration.');
  }
}

export async function runInit(): Promise<void> {
  const facts = detectRepoFacts();
  printHeader('Project Brain Init');
  await ensureBrainInitialized(facts);
  ensureAgentsGuidance(facts);
  console.error('- Next: connect your AI tool to `project-brain stdio` by following `docs/install.md`.');
}

export function printHelp(): void {
  console.error('Project Brain');
  console.error('');
  console.error('Usage:');
  console.error('  project-brain setup           Initialize `.project-brain/`, update `AGENTS.md`, and point your AI assistant at the installer guide');
  console.error('  project-brain doctor          Check repository readiness before or after AI-assisted installation');
  console.error('  project-brain init            Initialize `.project-brain/` and update repository-local `AGENTS.md` guidance');
  console.error('  project-brain stdio           Run the runtime tool surface over newline-delimited JSON on stdin/stdout');
  console.error('  project-brain help            Show this help');
}

export function parseCliArgs(argv: string[]) {
  return parseArgs(argv);
}
