import nextActionSchema from '../../../protocol/schemas/derived/next-action.schema.json';
import changeSchema from '../../../protocol/schemas/source/change.schema.json';
import decisionSchema from '../../../protocol/schemas/source/decision.schema.json';
import manifestSchema from '../../../protocol/schemas/source/manifest.schema.json';
import milestoneSchema from '../../../protocol/schemas/source/milestone.schema.json';
import moduleSchema from '../../../protocol/schemas/source/module.schema.json';
import noteSchema from '../../../protocol/schemas/source/note.schema.json';
import progressSchema from '../../../protocol/schemas/source/progress.schema.json';
import projectSpecSchema from '../../../protocol/schemas/source/project-spec.schema.json';

export const sourceSchemas = {
  change: changeSchema,
  decision: decisionSchema,
  manifest: manifestSchema,
  milestone: milestoneSchema,
  module: moduleSchema,
  note: noteSchema,
  progress: progressSchema,
  projectSpec: projectSpecSchema,
};

export const derivedSchemas = {
  nextAction: nextActionSchema,
};
