# Schema/Type Deduplication Map

**Context**: Duplicated enum and validation schema definitions exist across runtime input validation (`packages/core/src/runtime/inputSchemas.ts`) and infra storage validation (`packages/infra-fs/src/storage/validation.ts`), plus type definitions scattered across `packages/core/src/ports/storage.ts` and `packages/infra-fs/src/storage/changes.ts`.

**Risk**: These duplications can drift independently, causing validation mismatches between what users input and what gets persisted.

---

## CRITICAL DUPLICATIONS (Same Shape, Different Locations)

### 1. **Confidence Enum** (HIGHEST PRIORITY)
- **Location A**: `packages/core/src/runtime/inputSchemas.ts:4`
  ```typescript
  const confidenceSchema = z.enum(['low', 'mid', 'high']);
  ```
- **Location B**: `packages/infra-fs/src/storage/validation.ts:3`
  ```typescript
  const confidenceSchema = z.enum(['low', 'mid', 'high']);
  ```
- **Used in**: 
  - Input validation: `progressPayloadSchema`, `milestonePayloadSchema`, `progressMemoryPayloadSchema`, `ingestMemorySchema`
  - Storage validation: `progressEntrySchema`, `milestoneSchema`, `legacyProgressEntrySchema`, `nextActionSchema`
- **Type duplication**: `'low' | 'mid' | 'high'` appears in at least 15 files (queries, commands, understanding, ports)

---

### 2. **Change Status Enum**
- **Location A**: `packages/core/src/runtime/inputSchemas.ts:5`
  ```typescript
  const changeStatusSchema = z.enum(['proposed', 'active', 'done', 'dropped']);
  ```
- **Location B**: `packages/infra-fs/src/storage/validation.ts:33` (inline in changeSpecSchema)
  ```typescript
  status: z.enum(['proposed', 'active', 'done', 'dropped']),
  ```
- **Location C**: `packages/core/src/ports/storage.ts:1`
  ```typescript
  export type ChangeStatus = 'proposed' | 'active' | 'done' | 'dropped';
  ```
- **Location D**: `packages/infra-fs/src/storage/changes.ts:7`
  ```typescript
  export type ChangeStatus = 'proposed' | 'active' | 'done' | 'dropped';
  ```
- **Used in**: `createChangePayloadSchema`, `updateChangePatchSchema`, `changeSpecMemoryPayloadSchema`, `changeSpecSchema`

---

### 3. **Milestone Status Enum**
- **Location A**: `packages/core/src/runtime/inputSchemas.ts:6`
  ```typescript
  const milestoneStatusSchema = z.enum(['not_started', 'in_progress', 'completed']);
  ```
- **Location B**: `packages/infra-fs/src/storage/validation.ts:103` (inline in milestoneSchema)
  ```typescript
  status: z.enum(['not_started', 'in_progress', 'completed']),
  ```
- **Used in**: `milestonePayloadSchema`, `milestoneSchema`

---

### 4. **Progress Status Enum**
- **Location A**: `packages/core/src/runtime/inputSchemas.ts:7`
  ```typescript
  const progressStatusSchema = z.enum(['planned', 'in_progress', 'blocked', 'done']);
  ```
- **Location B**: `packages/infra-fs/src/storage/validation.ts:88` (inline in progressEntrySchema)
  ```typescript
  status: z.enum(['planned', 'in_progress', 'blocked', 'done']).optional(),
  ```
- **Used in**: `progressPayloadSchema`, `progressMemoryPayloadSchema`, `progressEntrySchema`

---

### 5. **Decision Scope Enum**
- **Location A**: `packages/core/src/runtime/inputSchemas.ts:67`
  ```typescript
  scope: z.enum(['project', 'change', 'module']).optional(),
  ```
- **Location B**: `packages/core/src/runtime/inputSchemas.ts:123` (duplicate inline)
  ```typescript
  scope: z.enum(['project', 'change', 'module']).optional(),
  ```
- **Location C**: `packages/infra-fs/src/storage/validation.ts:62`
  ```typescript
  scope: z.enum(['project', 'change', 'module']),
  ```
- **Used in**: `decisionPayloadSchema`, `decisionMemoryPayloadSchema`, `decisionSchema`

---

## FULL PAYLOAD SCHEMA DUPLICATIONS

### 6. **Change Spec Payload** (MAJOR DRIFT RISK)
**Files**:
- `packages/core/src/runtime/inputSchemas.ts:34-46` → `createChangePayloadSchema`
- `packages/core/src/runtime/inputSchemas.ts:104-116` → `changeSpecMemoryPayloadSchema`
- `packages/infra-fs/src/storage/validation.ts:29-43` → `changeSpecSchema`

**Differences (DRIFT VECTORS)**:
| Field | Input Schema | Memory Payload | Storage Schema |
|-------|--------------|---|---|
| `id` | optional | optional | required |
| `title` | required | required | required |
| `summary` | required | required | required |
| `status` | optional | optional | required |
| `goals` | optional array | optional array | required array |
| `non_goals` | optional array | optional array | required array |
| `constraints` | optional array | optional array | required array |
| `acceptance_criteria` | optional array | optional array | required array |
| `affected_areas` | optional array | optional array | required array |
| `module_ids` | optional array | optional array | optional array (default []) |
| `related_decision_ids` | optional array | optional array | required array |
| `created_at` | ✗ | ✗ | required |
| `updated_at` | ✗ | ✗ | required |

**Root Cause**: Input validation is lenient (all optional except title/summary); storage validation is strict (all required with timestamps).

---

### 7. **Decision Spec Payload** (MODERATE DRIFT RISK)
**Files**:
- `packages/core/src/runtime/inputSchemas.ts:61-71` → `decisionPayloadSchema`
- `packages/core/src/runtime/inputSchemas.ts:118-127` → `decisionMemoryPayloadSchema`
- `packages/infra-fs/src/storage/validation.ts:56-67` → `decisionSchema`

**Differences**:
| Field | Input Schema | Memory Payload | Storage Schema |
|-------|--------------|---|---|
| `id` | optional | ✗ | required |
| `alternatives_considered` | optional array | optional array | required array |
| `scope` | optional | optional | required |
| `module_ids` | optional array | optional array | optional array (default []) |
| `created_at` | ✗ | ✗ | required |

---

### 8. **Progress Entry Payload** (MODERATE DRIFT RISK)
**Files**:
- `packages/core/src/runtime/inputSchemas.ts:73-80` → `progressPayloadSchema`
- `packages/core/src/runtime/inputSchemas.ts:129-136` → `progressMemoryPayloadSchema`
- `packages/infra-fs/src/storage/validation.ts:84-93` → `progressEntrySchema`

**Differences**:
| Field | Input Schema | Memory Payload | Storage Schema |
|-------|--------------|---|---|
| `id` | ✗ | ✗ | required |
| `date` | ✗ | ✗ | required |
| `confidence` | required | required | required |
| Generated fields | N/A | N/A | Generated at persist time |

---

### 9. **Note Payload** (LOW DRIFT RISK)
**Files**:
- `packages/core/src/runtime/inputSchemas.ts:89-94` → `notePayloadSchema`
- `packages/infra-fs/src/storage/validation.ts:75-82` → `noteSchema`

**Differences**:
| Field | Input Schema | Storage Schema |
|-------|---|---|
| `id` | ✗ | required |
| `time` | ✗ | required |
| `tags` | optional array | required array (from input? unclear) |

---

### 10. **Milestone Payload** (LOW DRIFT RISK)
**Files**:
- `packages/core/src/runtime/inputSchemas.ts:82-87` → `milestonePayloadSchema`
- `packages/infra-fs/src/storage/validation.ts:101-108` → `milestoneSchema`

**Shape match**: Largely aligned, no critical drift vectors.

---

## HELPER SCHEMAS (DUPLICATED PRIMITIVES)

### 11. **String Array Schema**
- `packages/core/src/runtime/inputSchemas.ts:3`
  ```typescript
  const stringArraySchema = z.array(z.string());
  ```
- Inlined everywhere in storage validation (not extracted as named schema)

---

## EXTRACTION STRATEGY: SMALLEST SAFE CHANGE

### Phase 1: Extract Shared Enums (ZERO RISK)
**New file**: `packages/core/src/shared/schemas.ts`

Export these const definitions:
```typescript
export const confidenceSchema = z.enum(['low', 'mid', 'high']);
export const changeStatusSchema = z.enum(['proposed', 'active', 'done', 'dropped']);
export const milestoneStatusSchema = z.enum(['not_started', 'in_progress', 'completed']);
export const progressStatusSchema = z.enum(['planned', 'in_progress', 'blocked', 'done']);
export const decisionScopeSchema = z.enum(['project', 'change', 'module']);
export const stringArraySchema = z.array(z.string());
```

Also export derived TypeScript types for alignment:
```typescript
export type Confidence = z.infer<typeof confidenceSchema>;
export type ChangeStatus = z.infer<typeof changeStatusSchema>;
export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>;
export type ProgressStatus = z.infer<typeof progressStatusSchema>;
export type DecisionScope = z.infer<typeof decisionScopeSchema>;
```

**Impact**:
- ✅ Both `inputSchemas.ts` and `validation.ts` import from `packages/core/src/shared/schemas.ts`
- ✅ Remove duplicate const definitions from both files
- ✅ Replace inlined `z.enum(...)` with schema references in storage validation
- ✅ Consolidate type definitions in `packages/core/src/ports/storage.ts` (single source)
- ✅ Remove duplicate in `packages/infra-fs/src/storage/changes.ts` (re-export from ports)

---

### Phase 2: Establish Single Schema Source (MEDIUM RISK - requires care)

**Problem**: Input vs Storage schema shape divergence (optional vs required fields).

**Option A - Recommended**: Keep dual schemas but co-locate with explicit diff documentation.
- Input schemas live in `packages/core/src/runtime/inputSchemas.ts` (lenient for user UX)
- Storage schemas live in `packages/infra-fs/src/storage/validation.ts` (strict for persistence)
- Both reference shared enums from Phase 1
- Document explicit transformation layer in `packages/core/src/commands/` that bridges required/optional mismatches

**Option B - Higher Risk**: Merge schemas completely (breaks input UX for required fields).

---

## IMMEDIATE ACTION ITEMS (Minimal Change)

1. **Create** `packages/core/src/shared/schemas.ts` with extracted enums and types
2. **Update** `packages/core/src/runtime/inputSchemas.ts`:
   - Import enums from shared
   - Remove const definitions for: `confidenceSchema`, `changeStatusSchema`, `milestoneStatusSchema`, `progressStatusSchema`, `stringArraySchema`
   - Replace all inline `z.enum([...])` with schema references

3. **Update** `packages/infra-fs/src/storage/validation.ts`:
   - Import enums from shared
   - Remove const `confidenceSchema` definition
   - Replace inline `z.enum([...])` with schema references where possible

4. **Update** `packages/core/src/ports/storage.ts`:
   - Import and re-export types from shared
   - Keep `ChangeStatus` as canonical export (remove from `changes.ts`)

5. **Update** `packages/infra-fs/src/storage/changes.ts`:
   - Import `ChangeStatus` from `packages/core/src/ports/storage.ts` (or shared)
   - Remove local duplicate definition

---

## RISK ASSESSMENT

### Files Affected: 6
- `packages/core/src/runtime/inputSchemas.ts` (runtime validation)
- `packages/infra-fs/src/storage/validation.ts` (persistence validation)
- `packages/core/src/ports/storage.ts` (type definitions)
- `packages/infra-fs/src/storage/changes.ts` (storage implementation)
- `packages/core/src/commands/**/*.ts` (uses input schemas)
- `packages/infra-fs/src/storage/index.ts` (re-exports types)

### Drift Vectors (Before Fix)
- ⚠️ **HIGH**: Confidence enum appears 15+ times with duplicated literal strings
- ⚠️ **HIGH**: ChangeStatus appears 4 times with duplicated literal strings
- ⚠️ **MEDIUM**: Full change spec schema duplicated 3 ways with diverging optionality
- ⚠️ **MEDIUM**: Decision spec schema duplicated 3 ways with diverging optionality
- ⚠️ **LOW**: Milestone/Progress/Note schemas have minor drift vectors

### Mitigation After Fix
- ✅ Single enum definition = no independent drift
- ✅ Shared type derivation = type safety across boundaries
- ✅ Explicit transformation layer documentation = clear input→storage bridging logic
- ✅ Can still maintain separate input/storage schemas (dual but co-sourced)

---

## SUMMARY

**Exact Duplications Found**: 11 distinct schema/type definitions duplicated across 4+ locations

**Smallest Safe Extraction**: Create `packages/core/src/shared/schemas.ts` with 6 extracted enum schemas + 6 TypeScript types. Update 6 files to import from single source. No behavioral changes required.

**Estimated Scope**: 2-3 file edits, ~50 lines changed across codebase. Zero business logic changes.
