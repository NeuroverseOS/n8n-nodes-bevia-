// Bevia → Coordination Analysis → Run.
// Calls POST /zapier-action-coordination-analysis. Inputs match
// supabase/functions/zapier-action-coordination-analysis/index.ts.

import type { INodeProperties } from 'n8n-workflow';

export const coordinationAnalysisProperties: INodeProperties[] = [
  {
    displayName: 'Project Slug',
    name: 'projectSlug',
    type: 'string',
    default: '',
    description:
      'Read coordination shape for a specific project. One of Project Slug or Team Ref should be set.',
    displayOptions: {
      show: { resource: ['coordinationAnalysis'], operation: ['run'] },
    },
  },
  {
    displayName: 'Team Reference',
    name: 'teamRef',
    type: 'string',
    default: '',
    description: 'Optional team identifier when reading at the team level instead of a project.',
    displayOptions: {
      show: { resource: ['coordinationAnalysis'], operation: ['run'] },
    },
  },
];
