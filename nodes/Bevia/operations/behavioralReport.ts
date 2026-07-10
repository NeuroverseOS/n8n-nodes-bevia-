// Bevia → Behavioral Report → Generate.
// Calls POST /zapier-action-behavioral-report. Inputs match
// `interface ActionBody` in
// supabase/functions/zapier-action-behavioral-report/index.ts.

import type { INodeProperties } from 'n8n-workflow';

export const behavioralReportProperties: INodeProperties[] = [
  {
    displayName: 'Topic',
    name: 'topic',
    type: 'string',
    default: '',
    description:
      'Optional free-text topic to scope the read. Leave blank to read the overall shape.',
    displayOptions: {
      show: { resource: ['behavioralReport'], operation: ['generate'] },
    },
  },
  {
    displayName: 'Entity ID',
    name: 'entityId',
    type: 'string',
    default: '',
    description: 'Optional Bevia entity ID (a person, project, or topic) to scope the read.',
    displayOptions: {
      show: { resource: ['behavioralReport'], operation: ['generate'] },
    },
  },
  {
    displayName: 'Project Slug',
    name: 'projectSlug',
    type: 'string',
    default: '',
    description: 'Optional Bevia project slug. At least one of Topic / Entity ID / Project Slug should be set.',
    displayOptions: {
      show: { resource: ['behavioralReport'], operation: ['generate'] },
    },
  },
  {
    displayName: 'Time Window',
    name: 'timeWindow',
    type: 'options',
    default: 'week',
    // Ordered by duration (7 → 30 days), not alphabetically — a shorter
    // window reads before a longer one, which is the meaningful order for
    // the user. This is the n8n-core-idiomatic escape for options whose
    // natural order is numeric/semantic rather than lexical.
    // eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
    options: [
      { name: 'Last 7 Days', value: 'week' },
      { name: 'Last 30 Days', value: 'month' },
    ],
    description: 'How far back to read.',
    displayOptions: {
      show: { resource: ['behavioralReport'], operation: ['generate'] },
    },
  },
];
