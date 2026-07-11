// Bevia → Content → Send.
// Calls POST /zapier-intake. Use this when a workflow (or an AI agent)
// has a conversation or document Bevia's first-party intakes don't
// cover — a Trello card thread, an Airtable note, a custom chat log,
// an agent's own working notes. Provider-agnostic: anything that
// produces text is welcome into the map.
//
// Auth note: /zapier-intake accepts a token whose surface is 'zapier'
// or 'n8n'. Mint one under the n8n tab at /app/credentials.

import type { INodeProperties } from 'n8n-workflow';

export const sendContentProperties: INodeProperties[] = [
  {
    displayName: 'Content',
    name: 'content',
    type: 'string',
    typeOptions: { rows: 6 },
    default: '',
    required: true,
    description: 'The text to send into Bevia (a conversation, a note, or a document).',
    displayOptions: {
      show: { resource: ['content'], operation: ['send'] },
    },
  },
  {
    displayName: 'Source App',
    name: 'sourceApp',
    type: 'string',
    default: 'n8n',
    description:
      'A label for where this came from (e.g. "trello-thread", "claude-session", "agent-notes"). Provider-agnostic.',
    displayOptions: {
      show: { resource: ['content'], operation: ['send'] },
    },
  },
  {
    displayName: 'Source Date',
    name: 'sourceDate',
    type: 'dateTime',
    default: '',
    description: 'The original timestamp of the content. Defaults to now when left empty.',
    displayOptions: {
      show: { resource: ['content'], operation: ['send'] },
    },
  },
  {
    displayName: 'Source ID',
    name: 'sourceId',
    type: 'string',
    default: '',
    description: 'An upstream ID used as the thread identifier for dedup and continuity.',
    displayOptions: {
      show: { resource: ['content'], operation: ['send'] },
    },
  },
  {
    displayName: 'Source URL',
    name: 'sourceUrl',
    type: 'string',
    default: '',
    description: 'A URL pointing back at the original content.',
    displayOptions: {
      show: { resource: ['content'], operation: ['send'] },
    },
  },
  {
    displayName: 'Speaker Label',
    name: 'speakerLabel',
    type: 'string',
    default: '',
    description: 'A label for who said or wrote this.',
    displayOptions: {
      show: { resource: ['content'], operation: ['send'] },
    },
  },
];
