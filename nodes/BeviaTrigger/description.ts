// BeviaTrigger node — UI description.
//
// One polymorphic trigger node. The "Event" dropdown picks which of
// Bevia's 11 outbound events the workflow listens for. Card-emitted
// has an additional "Card Kind" filter.
//
// Wire contract: docs/specs/bevia-outbound-event-schema.md § 3.
// Node spec: docs/specs/bevia-n8n-community-node.md § 3.

import type { INodeProperties } from 'n8n-workflow';

/** Map from the underlying Bevia event name → REST-Hooks endpoint
 *  slug. The slug is the trailing path segment under
 *  /functions/v1/zapier-trigger-<slug>. */
export const EVENT_SLUG: Record<string, string> = {
  'card.emitted': 'zapier-trigger-card-emitted',
  'trajectory.changed': 'zapier-trigger-trajectory-changed',
  'alignment.shifted': 'zapier-trigger-alignment-shifted',
  'risk.threshold_crossed': 'zapier-trigger-risk-threshold-crossed',
  'repair.detected': 'zapier-trigger-repair-detected',
  'verification.insufficient': 'zapier-trigger-verification-insufficient',
  'continuity.updated': 'zapier-trigger-continuity-updated',
  'posture.shifted': 'zapier-trigger-posture-shifted',
  'commitment.drifted': 'zapier-trigger-commitment-drifted',
  'doctrine.ratified': 'zapier-trigger-doctrine-ratified',
  // Legacy alias kept for back-compat with the original Sprint 1.0e
  // Zapier zaps. Subscribes to drift.threshold_crossed under the
  // covers (deprecated event in shared/events.ts).
  'drift.threshold_crossed': 'zapier-trigger-drift-alert',
};

/** Events that ship with an automatic REST-Hooks subscribe
 *  endpoint. Anything not in this set falls back to the "manual
 *  webhook" guidance below: the user adds a webhook in
 *  /app/output/webhooks pointing at the n8n test URL. */
export const EVENT_HAS_AUTO_SUBSCRIBE: ReadonlySet<string> = new Set([
  'card.emitted',
  'trajectory.changed',
  'alignment.shifted',
  'risk.threshold_crossed',
  'repair.detected',
  'verification.insufficient',
  'continuity.updated',
  'posture.shifted',
  'commitment.drifted',
  'doctrine.ratified',
  'drift.threshold_crossed',
]);

// V1 launch (2026-05-19): the 11 subscribe endpoints exist and the
// dispatcher fires deliveries with HMAC signing, but only TWO events
// have producers wired in Bevia's compile layer today —
// `commitment.drifted` (commitment-matcher.ts) and `card.emitted`
// (cards/lifecycle.ts). The other nine subscribe successfully but
// no code emits them yet. We label them "(producer pending)" so
// workflow authors know what fires today vs what's rolling out, and
// don't waste time wiring a workflow against an event that will
// never fire in V1.
//
// As emit-point producers ship post-launch (e.g. trajectory.changed
// emit from the trajectory-classify path, risk.threshold_crossed
// emit from the watchlist scorer), drop the "(producer pending)"
// label in the same PR. The convention is the label IS the
// shipping signal.

export const triggerProperties: INodeProperties[] = [
  {
    displayName: 'Event',
    name: 'event',
    type: 'options',
    default: 'commitment.drifted',
    required: true,
    // Ordered by shipping status (live producers first, then producer-
    // pending, then legacy) so workflow authors see what fires today at
    // the top of the dropdown. The "(producer pending)" / "(legacy)"
    // labels carry that status per-item; this grouping is an intentional
    // semantic order, not a lexical one — hence the rule escape.
    // eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
    options: [
      // ── Live in V1 (have wired producers) ─────────────────────
      {
        name: 'On Commitment Drifted',
        value: 'commitment.drifted',
        description:
          "A stated commitment’s evidence is diverging from its claim. Not contradicted yet, but trending. Fires from commitment-matcher when a deliverable's text similarity to the original commitment falls into the drift band.",
      },
      {
        name: 'On Card Emitted (advanced)',
        value: 'card.emitted',
        description:
          'A new Card was persisted. Fires from the card lifecycle dispatcher. Filterable by Card kind below.',
      },
      // ── Producer pending (subscribe endpoint works; event firing
      // ──   from the compile layer ships post-V1)
      {
        name: 'On Trajectory Changed (producer pending)',
        value: 'trajectory.changed',
        description:
          'Endpoint ready — fires when the trajectory-classify producer ships. A sustained directional shift in how an actor or team is showing up across time.',
      },
      {
        name: 'On Risk Threshold Crossed (producer pending)',
        value: 'risk.threshold_crossed',
        description:
          'Endpoint ready — fires when the watchlist scorer producer ships. A watch-group condition crossed its severity threshold.',
      },
      {
        name: 'On Repair Detected (producer pending)',
        value: 'repair.detected',
        description:
          'Endpoint ready — fires when the repair-pattern producer ships. The substrate observed a repair pattern after a previous miss.',
      },
      {
        name: 'On Alignment Shifted (producer pending)',
        value: 'alignment.shifted',
        description:
          "Endpoint ready — fires when the alignment-edge producer ships. Two parties' baselines diverged or reconverged.",
      },
      {
        name: 'On Posture Shifted (producer pending)',
        value: 'posture.shifted',
        description:
          'Endpoint ready — fires when the posture-drift producer ships. The operator’s declared operational posture changed.',
      },
      {
        name: 'On Doctrine Ratified (producer pending)',
        value: 'doctrine.ratified',
        description:
          'Endpoint ready — fires when the doctrine-ratification producer ships. An AI-authored doctrine line was acknowledged by the operator.',
      },
      {
        name: 'On Continuity Updated (producer pending, advanced)',
        value: 'continuity.updated',
        description:
          'Endpoint ready — fires when the continuity-edge producer ships. A continuity edge transitioned — verified, contradicted, or scope_drifted.',
      },
      {
        name: 'On Verification Insufficient (producer pending, advanced)',
        value: 'verification.insufficient',
        description:
          "Endpoint ready — fires when the verification-gap producer ships. A continuity assertion lacks system-of-record evidence either way.",
      },
      // ── Legacy ────────────────────────────────────────────────
      {
        name: 'On Drift Alert (legacy, producer pending)',
        value: 'drift.threshold_crossed',
        description:
          "Deprecated — subscribe to 'Commitment Drifted' for new workflows. Kept for 30-day back-compat; not currently fired.",
      },
    ],
    description:
      'Which Bevia event this workflow listens for. Two events fire today (Commitment Drifted, Card Emitted); the rest have subscribe endpoints ready and ship producers post-launch.',
  },
  {
    displayName: 'Card Kind Filter',
    name: 'cardKindFilter',
    type: 'multiOptions',
    default: [],
    displayOptions: {
      show: { event: ['card.emitted'] },
    },
    options: [
      { name: 'Commitment Drift', value: 'commitment_drift' },
      { name: 'Doctrine Candidate', value: 'doctrine_candidate' },
      { name: 'Posture Shift', value: 'posture_shift' },
      { name: 'Recovery Reading', value: 'recovery_reading' },
      { name: 'Repair Attempt', value: 'repair_attempt' },
      { name: 'Risk Flag', value: 'risk_flag' },
      { name: 'Trajectory Reading', value: 'trajectory_reading' },
    ],
    description:
      'Only emit when the card matches one of these kinds. Empty = emit every card.emitted.',
  },
];
