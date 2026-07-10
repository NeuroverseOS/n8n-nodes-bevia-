// Bevia → Map → read operations.
//
// Each read maps to one Bevia readout edge function and returns JSON
// the workflow (or an AI agent) can act on. All are pure substrate
// reads — no LLM, ceiling 0 — so they are safe to call as often as a
// workflow needs.
//
// Auth note: the readout endpoints (territories-readout,
// trajectory-events, query-run, continent-landmarks-readout,
// compile-pulse, export-substrate) authenticate an MCP-surface token
// (a bvma_ token, or a bvex_ token whose row surface is 'mcp'). They
// do NOT accept the 'zapier'/'n8n' intake tokens. Mint an MCP token in
// Bevia Settings → Tokens and paste it into the credential when you
// use these reads. See the README "Authenticate" section.

import type { INodeProperties } from 'n8n-workflow';

// ─── Get Map (territories-readout) ────────────────────────────────
const getMapProperties: INodeProperties[] = [
  {
    displayName: 'Aperture ID',
    name: 'apertureId',
    type: 'string',
    default: '',
    description:
      'Optional Aperture to filter the map by source (leave empty for the full atlas).',
    displayOptions: {
      show: { resource: ['map'], operation: ['getMap'] },
    },
  },
  {
    displayName: 'Include Archived',
    name: 'includeArchived',
    type: 'boolean',
    default: false,
    description: 'Whether to include archived territories in the map.',
    displayOptions: {
      show: { resource: ['map'], operation: ['getMap'] },
    },
  },
];

// ─── Get What Changed (trajectory-events) ─────────────────────────
const getChangesProperties: INodeProperties[] = [
  {
    displayName: 'Time Window',
    name: 'scope',
    type: 'options',
    default: 'pulse',
    // Alphabetized by name to satisfy the option-ordering lint.
    options: [
      { name: 'Epoch (Last 30 Days)', value: 'epoch' },
      { name: 'Phase (Last 7 Days)', value: 'phase' },
      { name: 'Pulse (Last 24 Hours)', value: 'pulse' },
    ],
    description: 'How far back to read changes to your map.',
    displayOptions: {
      show: { resource: ['map'], operation: ['getChanges'] },
    },
  },
  {
    displayName: 'Max Events',
    name: 'maxEvents',
    type: 'number',
    typeOptions: { minValue: 1, maxValue: 500 },
    default: 200,
    description: 'The most events to return for the window.',
    displayOptions: {
      show: { resource: ['map'], operation: ['getChanges'] },
    },
  },
];

// ─── Query Map (query-run) ────────────────────────────────────────
const runQueryProperties: INodeProperties[] = [
  {
    displayName: 'Query',
    name: 'kind',
    type: 'options',
    default: 'recent_moments',
    // Alphabetized by name to satisfy the option-ordering lint.
    options: [
      { name: 'Cognition Flow', value: 'cognition_flow' },
      { name: 'Contradictions', value: 'contradictions' },
      { name: 'Contributor Activity', value: 'contributor_activity' },
      { name: 'Emerged Routes', value: 'routes_emerged' },
      { name: 'Grown Territories', value: 'territories_grown' },
      { name: 'Intelligence Relationships', value: 'intelligence_relationships' },
      { name: 'Loop Breakdown', value: 'loop_breakdown' },
      { name: 'Meaning Movement', value: 'meaning_movement' },
      { name: 'New Territories', value: 'new_territories' },
      { name: 'Notable Connections', value: 'notable_connections' },
      { name: 'One Significant Thing', value: 'pick_one_significant' },
      { name: 'Open Threads', value: 'open_threads' },
      { name: 'Recall', value: 'recall' },
      { name: 'Recent Ideas', value: 'recent_concepts' },
      { name: 'Recent Moments', value: 'recent_moments' },
      { name: 'Recurring Landmarks', value: 'landmarks_recurring' },
      { name: 'Territory Detail', value: 'territory_detail' },
      { name: 'Territory Moments', value: 'territory_moments' },
    ],
    description: 'The typed question to ask over your map.',
    displayOptions: {
      show: { resource: ['map'], operation: ['runQuery'] },
    },
  },
  {
    displayName: 'Window',
    name: 'window',
    type: 'string',
    default: '',
    description: 'Optional time window shorthand for the query, e.g. "7d", "30d", "24h".',
    displayOptions: {
      show: { resource: ['map'], operation: ['runQuery'] },
    },
  },
  {
    displayName: 'Result Count',
    name: 'resultCount',
    type: 'number',
    default: 0,
    description: 'Optional cap on the number of rows returned (0 uses the query default).',
    displayOptions: {
      show: { resource: ['map'], operation: ['runQuery'] },
    },
  },
  {
    displayName: 'Extra Parameters',
    name: 'extraParams',
    type: 'json',
    default: '{}',
    description:
      'Extra params merged into the query, as JSON. Required for queries that take an ID, e.g. {"territory_id":"..."} for Territory Detail.',
    displayOptions: {
      show: { resource: ['map'], operation: ['runQuery'] },
    },
  },
];

// ─── Get Landmarks (continent-landmarks-readout) ──────────────────
const getLandmarksProperties: INodeProperties[] = [
  {
    displayName: 'Continent ID',
    name: 'continentId',
    type: 'string',
    default: '',
    required: true,
    description: 'The continent whose landmark history to read (from a map or query result).',
    displayOptions: {
      show: { resource: ['map'], operation: ['getLandmarks'] },
    },
  },
  {
    displayName: 'Landmarks Per Territory',
    name: 'perTerritoryCap',
    type: 'number',
    typeOptions: { minValue: 1, maxValue: 24 },
    default: 6,
    description: 'The most landmarks to return for each member territory.',
    displayOptions: {
      show: { resource: ['map'], operation: ['getLandmarks'] },
    },
  },
];

// ─── Get Daily Pulse (compile-pulse) ──────────────────────────────
const getDailyPulseProperties: INodeProperties[] = [
  {
    displayName: 'Section',
    name: 'quadrant',
    type: 'options',
    default: 'briefing',
    // Alphabetized by name to satisfy the option-ordering lint.
    options: [
      { name: 'Briefing', value: 'briefing' },
      { name: 'Intelligences', value: 'intelligences' },
      { name: 'Projects', value: 'projects' },
      { name: 'You', value: 'you' },
    ],
    description: 'Which section of the daily pulse to compile.',
    displayOptions: {
      show: { resource: ['map'], operation: ['getDailyPulse'] },
    },
  },
];

// ─── Export Substrate (export-substrate) ──────────────────────────
const exportSubstrateProperties: INodeProperties[] = [
  {
    displayName: 'View',
    name: 'view',
    type: 'options',
    default: 'raw',
    // Alphabetized by name to satisfy the option-ordering lint.
    options: [
      { name: 'Interpretive (Fine-Tune Dataset)', value: 'interpretive' },
      { name: 'Raw (Portable Substrate Bundle)', value: 'raw' },
    ],
    description: 'Which export shape to produce.',
    displayOptions: {
      show: { resource: ['map'], operation: ['exportSubstrate'] },
    },
  },
  {
    displayName: 'Format',
    name: 'format',
    type: 'options',
    default: 'chat',
    // Alphabetized by name to satisfy the option-ordering lint.
    options: [
      { name: 'Alpaca', value: 'alpaca' },
      { name: 'Chat', value: 'chat' },
      { name: 'Completion', value: 'completion' },
    ],
    description: 'The dataset format for the interpretive view.',
    displayOptions: {
      show: { resource: ['map'], operation: ['exportSubstrate'], view: ['interpretive'] },
    },
  },
  {
    displayName: 'Since',
    name: 'since',
    type: 'dateTime',
    default: '',
    description: 'Only export substrate on or after this timestamp (leave empty for everything).',
    displayOptions: {
      show: { resource: ['map'], operation: ['exportSubstrate'] },
    },
  },
  {
    displayName: 'Max Records',
    name: 'maxRecords',
    type: 'number',
    typeOptions: { minValue: 1, maxValue: 50000 },
    default: 10000,
    description: 'The most records to export.',
    displayOptions: {
      show: { resource: ['map'], operation: ['exportSubstrate'] },
    },
  },
  {
    displayName: 'Acknowledge Export',
    name: 'acknowledge',
    type: 'boolean',
    default: false,
    description:
      'Whether you acknowledge this exports your substrate for use outside Bevia. Required to be true the first time you export.',
    displayOptions: {
      show: { resource: ['map'], operation: ['exportSubstrate'] },
    },
  },
];

export const mapProperties: INodeProperties[] = [
  ...getMapProperties,
  ...getChangesProperties,
  ...runQueryProperties,
  ...getLandmarksProperties,
  ...getDailyPulseProperties,
  ...exportSubstrateProperties,
];
