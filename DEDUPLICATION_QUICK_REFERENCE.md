# Quick Deduplication Reference

## CRITICAL ENUM DUPLICATIONS (Copy-Paste Identical)

```
┌─────────────────────────────────────────────────────────────────┐
│ LOCATION A: packages/core/src/runtime/inputSchemas.ts          │
├─────────────────────────────────────────────────────────────────┤
│ Line 3: const stringArraySchema = z.array(z.string());          │
│ Line 4: const confidenceSchema = z.enum([...])                 │
│ Line 5: const changeStatusSchema = z.enum([...])               │
│ Line 6: const milestoneStatusSchema = z.enum([...])            │
│ Line 7: const progressStatusSchema = z.enum([...])             │
│ Line 8: const retrievalEntrypointSchema = z.enum([...])        │
│ Line 9: const budgetModeSchema = z.enum([...])                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LOCATION B: packages/infra-fs/src/storage/validation.ts        │
├─────────────────────────────────────────────────────────────────┤
│ Line 3: const confidenceSchema = z.enum([...])      ◄── DUPE  │
│ Lines 33,62,88,103: z.enum(...) INLINE (not extracted)         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LOCATION C: packages/core/src/ports/storage.ts                │
├─────────────────────────────────────────────────────────────────┤
│ Line 1: export type ChangeStatus = 'proposed'|... ◄── DUPE    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LOCATION D: packages/infra-fs/src/storage/changes.ts          │
├─────────────────────────────────────────────────────────────────┤
│ Line 7: export type ChangeStatus = 'proposed'|... ◄── DUPE    │
└─────────────────────────────────────────────────────────────────┘
```

## PAYLOAD SCHEMA DUPLICATIONS (Different Shapes!)

```
CHANGE SPEC:
┌─────────────────────────────────────────────────────────────────┐
│ inputSchemas.ts (34-46): createChangePayloadSchema              │
│ → All arrays are OPTIONAL                                       │
│ → Missing: created_at, updated_at                              │
├─────────────────────────────────────────────────────────────────┤
│ inputSchemas.ts (104-116): changeSpecMemoryPayloadSchema        │
│ → All arrays are OPTIONAL                                       │
│ → Missing: created_at, updated_at                              │
├─────────────────────────────────────────────────────────────────┤
│ validation.ts (29-43): changeSpecSchema                         │
│ → All arrays are REQUIRED                                       │
│ → Includes: created_at, updated_at                             │
│ → Default: module_ids defaults to []                            │
└─────────────────────────────────────────────────────────────────┘
```

## EXTRACTION PLAN (Minimal Changes)

```
NEW FILE: packages/core/src/shared/schemas.ts
├─ export const confidenceSchema
├─ export const changeStatusSchema
├─ export const milestoneStatusSchema
├─ export const progressStatusSchema
├─ export const decisionScopeSchema
├─ export const stringArraySchema
├─ export type Confidence
├─ export type ChangeStatus
├─ export type MilestoneStatus
├─ export type ProgressStatus
└─ export type DecisionScope

UPDATE: packages/core/src/runtime/inputSchemas.ts
├─ Remove: 6 const definitions (lines 3-9)
├─ Add: import { ..., schemas } from '../shared/schemas.js'
└─ Use: changeStatusSchema instead of z.enum([...])

UPDATE: packages/infra-fs/src/storage/validation.ts
├─ Remove: confidenceSchema const (line 3)
├─ Add: import { ..., schemas } from '@project-brain/core/shared'
└─ Use: changeStatusSchema, etc. inline

UPDATE: packages/core/src/ports/storage.ts
├─ Remove: inline ChangeStatus type
├─ Add: export { ChangeStatus } from '../shared/schemas.js'
└─ Keep: Interface definitions (they use the type)

UPDATE: packages/infra-fs/src/storage/changes.ts
├─ Remove: duplicate ChangeStatus (line 7)
└─ Add: import { ChangeStatus } from '@project-brain/core/ports'
```

## DRIFT RISK LEVELS

| Item | Before | After | Mechanism |
|------|--------|-------|-----------|
| Confidence enum | 15+ defs | 1 export | Single z.enum, multiple z.infer |
| ChangeStatus enum | 4 defs | 1 export | Single z.enum, multiple z.infer |
| Milestone status | 2 defs | 1 export | ^^ |
| Progress status | 2 defs | 1 export | ^^ |
| Decision scope | 3 defs (2 inlined) | 1 export | ^^ |

## NO BEHAVIORAL CHANGES REQUIRED
- ✅ Input validation: still lenient (optional fields)
- ✅ Storage validation: still strict (required fields)
- ✅ Commands: no logic changes
- ✅ Queries: no logic changes
- ✅ Type safety: improved by zod.infer
