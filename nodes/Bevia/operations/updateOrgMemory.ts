// Bevia → Organizational Memory → Update.
// Calls POST /zapier-action-update-org-memory. The endpoint creates
// a pending doctrine candidate; the operator still has to ratify it
// in the Bevia UI — n8n never silently writes doctrine.

import type { INodeProperties } from 'n8n-workflow';

export const updateOrgMemoryProperties: INodeProperties[] = [
  {
    displayName: 'Content',
    name: 'content',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    required: true,
    description: 'The doctrine candidate, observation, or commitment text.',
    displayOptions: {
      show: { resource: ['updateOrgMemory'], operation: ['update'] },
    },
  },
  {
    displayName: 'Kind',
    name: 'kind',
    type: 'options',
    default: 'observation',
    options: [
      { name: 'Doctrine', value: 'doctrine' },
      { name: 'Observation', value: 'observation' },
      { name: 'Commitment', value: 'commitment' },
    ],
    description: 'What kind of memory entry this is.',
    displayOptions: {
      show: { resource: ['updateOrgMemory'], operation: ['update'] },
    },
  },
  {
    displayName: 'Source Label',
    name: 'sourceApp',
    type: 'string',
    default: 'n8n',
    description: 'Free-text label for the originating tool (e.g. "n8n", "trello-thread", "airtable-note").',
    displayOptions: {
      show: { resource: ['updateOrgMemory'], operation: ['update'] },
    },
  },
  {
    displayName: 'Source URL',
    name: 'sourceUrl',
    type: 'string',
    default: '',
    description: 'Optional URL pointing at where this memory came from.',
    displayOptions: {
      show: { resource: ['updateOrgMemory'], operation: ['update'] },
    },
  },
  {
    displayName: 'Source ID',
    name: 'sourceId',
    type: 'string',
    default: '',
    description: 'Optional upstream id — used to deduplicate retries.',
    displayOptions: {
      show: { resource: ['updateOrgMemory'], operation: ['update'] },
    },
  },
  {
    displayName: 'Speaker Label',
    name: 'speakerLabel',
    type: 'string',
    default: '',
    description: 'Optional label for who said / wrote this memory.',
    displayOptions: {
      show: { resource: ['updateOrgMemory'], operation: ['update'] },
    },
  },
];
