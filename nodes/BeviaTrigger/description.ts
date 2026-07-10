// BeviaTrigger node — UI description.
//
// One polling trigger. On each poll it reads /trajectory-events — the
// confirmed per-principal stream of changes to the map — and emits
// only events the workflow hasn't seen yet. The "Event" dropdown
// filters to a single trajectory_event kind (or all).
//
// Doctrine (ADR-0054): n8n polls Bevia; Bevia never pushes. This is
// the pull-shaped shape the outbound doctrine requires.

import type { INodeProperties } from 'n8n-workflow';

/** The confirmed trajectory_event kinds emitted by /trajectory-events
 *  (verified against supabase/functions/trajectory-events/index.ts).
 *  'all' is the node-level sentinel for "don't filter". */
export const TRAJECTORY_EVENT_KINDS = [
  'cluster_formed',
  'cluster_grew',
  'cluster_dormant',
  'cluster_revived',
  'continent_formed',
  'worldview_shifted',
  'territory_promoted',
] as const;

export const triggerProperties: INodeProperties[] = [
  {
    displayName: 'Event',
    name: 'event',
    type: 'options',
    default: 'cluster_formed',
    required: true,
    // Alphabetized by name to satisfy the option-ordering lint. The
    // default (New Territory Formed) is set on the property, not by
    // list position.
    options: [
      {
        name: 'All Events',
        value: 'all',
        description: 'Emit on any change to your map.',
      },
      {
        name: 'Continent Formed',
        value: 'continent_formed',
        description: 'A group of related territories cohered into a continent.',
      },
      {
        name: 'New Territory Formed',
        value: 'cluster_formed',
        description: 'A new territory took shape in your map.',
      },
      {
        name: 'Territory Came Back',
        value: 'cluster_revived',
        description: 'A dormant territory became active again.',
      },
      {
        name: 'Territory Grew',
        value: 'cluster_grew',
        description: 'An existing territory gained new evidence.',
      },
      {
        name: 'Territory Promoted',
        value: 'territory_promoted',
        description: 'A territory crossed the promotion threshold.',
      },
      {
        name: 'Territory Went Quiet',
        value: 'cluster_dormant',
        description: 'An active territory went dormant.',
      },
      {
        name: 'Worldview Shifted',
        value: 'worldview_shifted',
        description: 'A high-level worldview in your map shifted.',
      },
    ],
    description: 'Which change to your map this workflow reacts to.',
  },
];
