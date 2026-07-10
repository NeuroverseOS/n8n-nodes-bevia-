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
  {
    displayName: 'Resource',
    name: 'resource',
    type: 'options',
    noDataExpression: true,
    default: 'map',
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
