# Project Brain Spec

## 1. Product Goal

Project Brain is an engineering memory mechanism for AI collaborative development.

Its purpose is to help a project continuously ingest signals, analyze execution, preserve durable memory, and reflect stable conclusions into project spec.

The target loop is:

`memory ingestion -> development trace -> project spec`

## 2. Product Principles

### 2.1 Analysis-Driven Memory

Project Brain must analyze repository activity, project input, and execution traces so the system can decide what should become durable memory.

Without analysis, memory ingestion and development recording cannot scale.

### 2.2 Memory Over Chat

Important project context should not remain trapped inside chat transcripts or model short-term context.

Important conclusions and signals must be ingested into explicit project memory.

### 2.3 Traceable Development

Execution should continuously leave behind structured traces:

- decisions
- progress
- changes
- code evidence

### 2.4 Spec As Reflection

`project-spec` should reflect stable project truth that has survived analysis, recording, and repeated execution evidence.

It is not a scratchpad, temporary note bucket, or compatibility-test output.

### 2.5 Optional Identity Anchor

`manifest` is helpful, but not mandatory.

Projects should still be able to accumulate useful memory and context even when no formal initialization happened at the beginning.

## 3. Core Objects

### 3.1 Manifest

Purpose: optional project identity anchor.

Contains:

- project name
- summary
- repo type
- primary stack
- long-term goal

Constraint:

- it should describe identity, not governance

### 3.2 Project Spec

Purpose: stable cross-change project truth.

Contains:

- product goal
- non-goals
- architecture rules
- coding rules
- agent rules

Constraint:

- it should only hold conclusions that are stable enough to guide multiple future changes

### 3.3 Change Spec

Purpose: structured contract for a single change.

Contains:

- title
- summary
- goals
- non-goals
- constraints
- acceptance criteria
- affected areas
- related decisions
- status

Constraint:

- a change spec is the bridge between recorded intent and execution

### 3.4 Memory Records

Purpose: preserve process and rationale.

Types:

- `decision`
- `progress`
- `note`
- `milestone`
- `code evidence` inferred from git and repository activity

## 4. Intended Workflow

### 4.1 Ingest

Signals enter Project Brain from multiple sources:

- user input
- discussion outcomes
- repository activity
- development work

Project Brain does not need to own the earlier divergence stage to be useful.

### 4.2 Analyze

The system interprets incoming signals and ongoing code activity.

Typical analysis goals:

- identify what is stable enough to remember
- detect relevant progress and milestones
- connect raw activity to existing decisions or changes
- surface candidate conclusions for later spec reflection

### 4.3 Record

Structured records are written into Project Brain.

The system should preserve:

- record type
- source
- confirmation boundary
- cross-links to other project memory

### 4.4 Execute

Agents and developers use `brain_context` or `brain_change_context` instead of depending on prior chat history.

### 4.5 Reflect

Stable conclusions discovered through repeated recording and analysis should eventually update `project-spec`.

This reflection step is required for long-term project coherence.

## 5. Current Product Scope

Project Brain currently supports:

- file-backed project memory
- explicit ingest of structured records
- change-level context assembly
- dashboard-style memory inspection
- git-backed activity analysis
- recommendation and progress estimation

## 6. Current Product Gaps

The most important gaps are:

- analysis outputs are not yet promoted into durable memory aggressively enough
- development recording is still too dependent on explicit manual ingest
- spec reflection is still too manual
- note-to-decision, note-to-change, and process-to-spec promotion are still weak

## 7. Guardrails

Project Brain should avoid:

- treating temporary experiments as stable spec
- silently mutating durable truth without explicit intent
- making initialization a hard prerequisite for all usage
- weakening analysis to the point that memory and process recording lose signal quality

## 8. Near-Term Direction

Near-term evolution should focus on stronger memory formation and reflection mechanisms, especially:

- better promotion rules from analysis outputs into durable memory
- stronger pathways from note to decision or change
- clearer promotion rules from memory to project spec
- workflows that help AI agents write back structured conclusions during development
