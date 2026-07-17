// Bevia action node — UI description.
//
// Resource / Operation pattern. Three resources:
//   - Map     → read the map of your thinking (territories, changes,
//               landmarks, daily pulse), query it, and export the
//               substrate.
//   - Content → send content into Bevia (intake).
//   - Note    → file an observation / commitment / doctrine candidate.
//
// Every operation maps to exactly one verified Bevia edge function.
// The node is a thin transport shim; the endpoints own SPE
// charge/settle and governance.

import type { INodeProperties } from 'n8n-workflow';

import { mapProperties } from './operations/reads';
import { sendContentProperties } from './operations/sendContent';
import { addNoteProperties } from './operations/addNote';

/** Operation value → edge-function slug. Every call is a POST. Keys
 *  are unique across resources so this single map resolves the
 *  endpoint without needing the resource. */
export const OPERATION_ENDPOINT: Record<string, string> = {
  // Map (reads)
  getMap: 'territories-readout',
  getChanges: 'trajectory-events',
  runQuery: 'query-run',
  getLandmarks: 'continent-landmarks-readout',
  getDailyPulse: 'compile-pulse',
  exportSubstrate: 'export-substrate',
  // Content (intake)
  send: 'zapier-intake',
  // Note (write-back)
  add: 'zapier-action-update-org-memory',
};

export const actionProperties: INodeProperties[] = [
  // Where this node talks to. Cloud = api.bevia.co (API token from
  // /app/credentials). Local = the Bevia Local engine on the user's
  // own machine, paired with the Port + Code the desktop app shows
  // under Apps -> n8n. Local supports Content -> Send today (the
  // router feeds the on-device map); map reads stay cloud for now.
  {
    displayName: 'Connect To',
    name: 'connection',
    type: 'options',
    noDataExpression: true,
    default: 'cloud',
    options: [
      {
        name: 'Bevia Cloud',
        value: 'cloud',
        description: 'Your Bevia account at api.bevia.co',
      },
      {
        name: 'Bevia Local',
        value: 'local',
        description:
          'The Bevia engine running on your own machine — pair it in the Bevia app under Apps → n8n (self-hosted n8n only; n8n Cloud cannot reach your machine)',
      },
    ],
  },
  {
    displayName: 'Resource',
    name: 'resource',
    type: 'options',
    noDataExpression: true,
    default: 'map',
    displayOptions: { show: { connection: ['cloud'] } },
    // Alphabetized by name to satisfy the option-ordering lint.
    options: [
      {
        name: 'Content',
        value: 'content',
        description: 'Send content into Bevia.',
      },
      {
        name: 'Map',
        value: 'map',
        description: 'Read the map of your thinking and export your substrate.',
      },
      {
        name: 'Note',
        value: 'note',
        description: 'File an observation, commitment, or doctrine candidate.',
      },
    ],
  },
  // Local connections send content into the on-device map — the one
  // resource the engine's capture door serves (Explore verbs stay on
  // the surfaces the user authorized for exploration, ADR-0176).
  {
    displayName: 'Resource',
    name: 'resource',
    type: 'options',
    noDataExpression: true,
    default: 'content',
    displayOptions: { show: { connection: ['local'] } },
    options: [
      {
        name: 'Content',
        value: 'content',
        description: 'Send content into your local map.',
      },
    ],
  },

  // ── Map operations ────────────────────────────────────────────
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    default: 'getMap',
    displayOptions: { show: { resource: ['map'] } },
    // Alphabetized by name to satisfy the option-ordering lint.
    options: [
      {
        name: 'Export Substrate',
        value: 'exportSubstrate',
        description: 'Export a portable copy of your substrate.',
        action: 'Export my substrate',
      },
      {
        name: 'Get Daily Pulse',
        value: 'getDailyPulse',
        description: 'Get the daily pulse — what to know today.',
        action: 'Get my daily pulse',
      },
      {
        name: 'Get Landmarks',
        value: 'getLandmarks',
        description: 'Get the landmark history for a continent.',
        action: 'Get my landmarks',
      },
      {
        name: 'Get Map',
        value: 'getMap',
        description: 'Get the territories the map currently sees.',
        action: 'Get my map',
      },
      {
        name: 'Get What Changed',
        value: 'getChanges',
        description: 'Get recent changes to the map — new, grown, dormant, revived.',
        action: 'Get what changed',
      },
      {
        name: 'Query Map',
        value: 'runQuery',
        description: 'Ask a typed question over the map.',
        action: 'Query my map',
      },
    ],
  },

  // ── Content operations ────────────────────────────────────────
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    default: 'send',
    displayOptions: { show: { resource: ['content'] } },
    options: [
      {
        name: 'Send',
        value: 'send',
        description: 'Send content into the Bevia substrate.',
        action: 'Send content into Bevia',
      },
    ],
  },

  // ── Note operations ───────────────────────────────────────────
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    default: 'add',
    displayOptions: { show: { resource: ['note'] } },
    options: [
      {
        name: 'Add',
        value: 'add',
        description: 'Add a note or observation for operator review.',
        action: 'Add a note or observation',
      },
    ],
  },

  // Per-operation property descriptions.
  ...mapProperties,
  ...sendContentProperties,
  ...addNoteProperties,
];
