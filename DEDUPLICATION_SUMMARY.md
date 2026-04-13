# Deduplication Findings: Executive Summary

## Task Completed ✅

**Objective**: Find the most important duplicated schema/type definitions across the repo, especially where runtime input validation and infra storage validation describe the same domain shapes.

**Deliverables**: 
1. ✅ `DEDUPLICATION_MAP.md` - Comprehensive analysis (288 lines)
2. ✅ `DEDUPLICATION_QUICK_REFERENCE.md` - Visual quick reference (109 lines)

---

## Key Findings

### 11 Critical Duplications Found

#### Enum Duplications (Copy-Paste Identical)
| Name | Locations | Risk | Values |
|------|-----------|------|--------|
| `confidenceSchema` | 2 files | 🔴 HIGH | `['low', 'mid', 'high']` |
| `changeStatusSchema` | 4 defs (2 types, 2 schemas) | 🔴 HIGH | `['proposed', 'active', 'done', 'dropped']` |
| `milestoneStatusSchema` | 2 files | 🟡 MEDIUM | `['not_started', 'in_progress', 'completed']` |
| `progressStatusSchema` | 2 files | 🟡 MEDIUM | `['planned', 'in_progress', 'blocked', 'done']` |
| `decisionScopeSchema` | 3 defs (1 inlined × 2) | 🟡 MEDIUM | `['project', 'change', 'module']` |
| `stringArraySchema` | 1 def + 20+ inlined | 🟡 MEDIUM | `z.array(z.string())` |

#### Full Payload Schema Duplications (Different Shapes!)
| Schema | Locations | Drift Vectors | Risk |
|--------|-----------|---|---|
| **Change Spec** | 3 places | Optional vs Required arrays, missing timestamps | 🔴 HIGH |
| **Decision Spec** | 3 places | Optional vs Required arrays, no `id` in memory | 🔴 HIGH |
| **Progress Entry** | 3 places | Generated fields missing in input schema | 🟡 MEDIUM |
| **Note Payload** | 2 places | Generated `id` and `time` fields | 🟡 MEDIUM |
| **Milestone Payload** | 2 places | Largely aligned | 🟢 LOW |

---

## Root Cause

Two separate validation layers evolved independently:
- **Runtime validation** (`packages/core/src/runtime/inputSchemas.ts`): Lenient, user-facing
- **Storage validation** (`packages/infra-fs/src/storage/validation.ts`): Strict, database-facing

Schema definitions were copy-pasted rather than sourced from a shared location, creating **11 drift vectors**.

---

## Extraction Strategy (Minimal-Change Safe)

### Phase 1: Extract Shared Enums (ZERO RISK)
**New file**: `packages/core/src/shared/schemas.ts`
- 6 exported `z.enum(...)` constants
- 6 exported TypeScript types (via `z.infer<>`)
- Update 4 files to import instead of duplicating

### Phase 2: Keep Dual Schemas (INTENTIONAL DIVERGENCE)
- Input schemas stay lenient (for UX)
- Storage schemas stay strict (for persistence)
- Both reference shared enums from Phase 1
- Commands layer handles optional→required bridging

**No behavioral changes required.** Just source control over enum definitions.

---

## Files to Modify (6 total)

1. ✨ **NEW**: `packages/core/src/shared/schemas.ts` (create)
2. 📝 `packages/core/src/runtime/inputSchemas.ts` (import enums, remove 6 const defs)
3. 📝 `packages/infra-fs/src/storage/validation.ts` (import enums, remove 1 const def, replace inline z.enum)
4. 📝 `packages/core/src/ports/storage.ts` (re-export types from shared)
5. 📝 `packages/infra-fs/src/storage/changes.ts` (remove duplicate ChangeStatus type)
6. 📝 `packages/infra-fs/src/storage/index.ts` (update re-export path if needed)

**Scope**: ~50 lines changed, zero logic changes.

---

## Verification Checkpoints

Before implementing changes:
- [ ] Read `DEDUPLICATION_MAP.md` Section "EXTRACTION STRATEGY: SMALLEST SAFE CHANGE"
- [ ] Review all 6 files for current usage patterns
- [ ] Confirm test coverage for input validation roundtrips

After extraction:
- [ ] `lsp_diagnostics` on all 6 modified files (clean)
- [ ] TypeScript build passes
- [ ] All existing tests pass (no behavior changed)
- [ ] Git diff shows only import/export rewrites

---

## Immediate Next Steps

1. Run `openspec-apply-change` to implement Phase 1 (enum extraction)
2. Verify no TypeScript or runtime errors
3. Document transformation layer in commands (input→storage bridging)
4. Consider Phase 2 improvements (optional: merge lenient/strict schemas explicitly)

---

## References

- **Detailed Map**: `./DEDUPLICATION_MAP.md` (full context, all line numbers, diff tables)
- **Quick Visual**: `./DEDUPLICATION_QUICK_REFERENCE.md` (executive diagrams)
- **This File**: Executive summary

**Status**: Ready for implementation. All evidence collected, zero speculative findings. ✅
