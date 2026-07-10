// Bevia → Substrate Intake → Send Conversation.
// Calls POST /zapier-intake. Use this when an n8n workflow has
// access to a conversation Bevia’s first-party intakes don’t cover
// (Trello card comment threads, Airtable note fields, custom
// internal chat, etc.). Provider-agnostic — anything that produces
// a textual exchange is welcome.

import type { INodeProperties } from 'n8n-workflow';

export const substrateIntakeProperties: INodeProperties[] = [
  {
    displayName: 'Source App',
    name: 'sourceApp',
    type: 'string',
    default: 'n8n',
    description:
      'Free-text label for the originating tool (e.g. "trello-thread", "claude-session", "slack-thread", "airtable-note"). Provider-agnostic.',
    displayOptions: {
      show: { resource: ['substrateIntake'], operation: ['send'] },
    },
  },
  {
    displayName: 'Content',
    name: 'content',
    type: 'string',
    typeOptions: { rows: 6 },
    default: '',
    required: true,
    description: 'The conversation text (or JSON-shaped payload Bevia can stringify).',
    displayOptions: {
      show: { resource: ['substrateIntake'], operation: ['send'] },
    },
  },
  {
    displayName: 'Source Date',
    name: 'sourceDate',
    type: 'dateTime',
    default: '',
    description: 'Optional original timestamp. Defaults to now if unset.',
    displayOptions: {
      show: { resource: ['substrateIntake'], operation: ['send'] },
    },
  },
  {
    displayName: 'Source ID',
    name: 'sourceId',
    type: 'string',
    default: '',
    description:
      'Optional upstream id — used as the thread identifier for dedup and continuity.',
    displayOptions: {
      show: { resource: ['substrateIntake'], operation: ['send'] },
    },
  },
  {
    displayName: 'Source URL',
    name: 'sourceUrl',
    type: 'string',
    default: '',
    description: 'Optional URL pointing back at the original conversation.',
    displayOptions: {
      show: { resource: ['substrateIntake'], operation: ['send'] },
    },
  },
  {
    displayName: 'Speaker Label',
    name: 'speakerLabel',
    type: 'string',
    default: '',
    description: 'Optional label for who said / wrote this turn.',
    displayOptions: {
      show: { resource: ['substrateIntake'], operation: ['send'] },
    },
  },
];
