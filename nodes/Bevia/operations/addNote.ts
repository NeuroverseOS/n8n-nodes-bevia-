// Bevia → Note → Add.
// Calls POST /zapier-action-update-org-memory. This is the write-back
// path a person (or an AI agent) uses to file an observation, a
// commitment, or a doctrine candidate against the substrate. The
// entry lands as a pending candidate; the operator still ratifies it
// in the Bevia UI — n8n never silently writes doctrine.
//
// Auth note: /zapier-action-update-org-memory accepts a token whose
// surface is 'zapier'. Mint one at /app/credentials.

import type { INodeProperties } from 'n8n-workflow';

export const addNoteProperties: INodeProperties[] = [
  {
    displayName: 'Content',
    name: 'content',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    required: true,
    description: 'The observation, commitment, or doctrine candidate text.',
    displayOptions: {
      show: { resource: ['note'], operation: ['add'] },
    },
  },
  {
    displayName: 'Kind',
    name: 'kind',
    type: 'options',
    default: 'observation',
    // Alphabetized by name to satisfy the option-ordering lint.
    options: [
      { name: 'Commitment', value: 'commitment' },
      { name: 'Doctrine', value: 'doctrine' },
      { name: 'Observation', value: 'observation' },
    ],
    description: 'What kind of note this is.',
    displayOptions: {
      show: { resource: ['note'], operation: ['add'] },
    },
  },
  {
    displayName: 'Source Label',
    name: 'sourceApp',
    type: 'string',
    default: 'n8n',
    description: 'A label for where this note came from (e.g. "n8n", "agent", "meeting-notes").',
    displayOptions: {
      show: { resource: ['note'], operation: ['add'] },
    },
  },
  {
    displayName: 'Source URL',
    name: 'sourceUrl',
    type: 'string',
    default: '',
    description: 'A URL pointing at where this note came from.',
    displayOptions: {
      show: { resource: ['note'], operation: ['add'] },
    },
  },
  {
    displayName: 'Source ID',
    name: 'sourceId',
    type: 'string',
    default: '',
    description: 'An upstream ID used to deduplicate retries.',
    displayOptions: {
      show: { resource: ['note'], operation: ['add'] },
    },
  },
  {
    displayName: 'Speaker Label',
    name: 'speakerLabel',
    type: 'string',
    default: '',
    description: 'A label for who wrote this note.',
    displayOptions: {
      show: { resource: ['note'], operation: ['add'] },
    },
  },
];
