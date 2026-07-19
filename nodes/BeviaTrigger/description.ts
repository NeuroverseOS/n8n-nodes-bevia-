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
  // Map dynamics (the meaning substrate — territories, continents,
  // worldviews). All seven fire today from the trajectory-outbound
  // tick.
  'territory.emerged': 'zapier-trigger-territory-emerged',
  'territory.grew': 'zapier-trigger-territory-grew',
  'territory.dormant': 'zapier-trigger-territory-dormant',
  'territory.revived': 'zapier-trigger-territory-revived',
  'territory.promoted': 'zapier-trigger-territory-promoted',
  'continent.formed': 'zapier-trigger-continent-formed',
  'worldview.shifted': 'zapier-trigger-worldview-shifted',
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
  'territory.emerged',
  'territory.grew',
  'territory.dormant',
  'territory.revived',
  'territory.promoted',
  'continent.formed',
  'worldview.shifted',
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

// V1 launch (2026-05-19), refreshed 2026-07-19: the subscribe
// endpoints all exist and the dispatcher fires deliveries with HMAC
// signing. Events with wired producers TODAY: the seven map_dynamics
// events (territory.emerged / grew / dormant / revived / promoted,
// continent.formed, worldview.shifted — all emitted by the
// trajectory-outbound tick as the meaning substrate moves), plus
// `commitment.drifted` (commitment-matcher.ts) and `card.emitted`
// (cards/lifecycle.ts). The remaining events subscribe successfully
// but no code emits them yet. We label those "(producer pending)" so
// workflow authors know what fires today vs what's rolling out, and
// don't waste time wiring a workflow against an event that will
// never fire.
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
    default: 'territory.emerged',
    required: true,
    options: [
      // ── Map dynamics (live — fire today as the map moves) ─────
      {
        name: 'On Territory Emerged',
        value: 'territory.emerged',
        description:
          'A new territory formed on the map — enough evidence began pointing to the same place. Fires from the trajectory-outbound tick.',
      },
      {
        name: 'On Territory Grew',
        value: 'territory.grew',
        description:
          'An existing territory accumulated meaningfully more evidence in the last window. Fires from the trajectory-outbound tick.',
      },
      {
        name: 'On Territory Promoted',
        value: 'territory.promoted',
        description:
          'A territory crossed its stability gate and earned a stable place on the map. Fires from the trajectory-outbound tick.',
      },
      {
        name: 'On Territory Dormant',
        value: 'territory.dormant',
        description:
          'A previously active territory went quiet (no fresh evidence for the dormancy window). Fires from the trajectory-outbound tick.',
      },
      {
        name: 'On Territory Revived',
        value: 'territory.revived',
        description:
          'A dormant territory came back to life — fresh evidence landed on it. Fires from the trajectory-outbound tick.',
      },
      {
        name: 'On Continent Formed',
        value: 'continent.formed',
        description:
          'A group of related territories cohered into a continent. Fires from the trajectory-outbound tick.',
      },
      {
        name: 'On Worldview Shifted',
        value: 'worldview.shifted',
        description:
          'The highest-altitude structure of the map changed. Fires from the trajectory-outbound tick.',
      },
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
      'Which Bevia event this workflow listens for. The seven map events (territories, continents, worldviews) plus Commitment Drifted and Card Emitted fire today; the rest have subscribe endpoints ready and ship producers post-launch.',
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
      { name: 'Risk Flag', value: 'risk_flag' },
      { name: 'Trajectory Reading', value: 'trajectory_reading' },
      { name: 'Repair Attempt', value: 'repair_attempt' },
      { name: 'Recovery Reading', value: 'recovery_reading' },
      { name: 'Posture Shift', value: 'posture_shift' },
      { name: 'Doctrine Candidate', value: 'doctrine_candidate' },
    ],
    description:
      'Only emit when the card matches one of these kinds. Empty = emit every card.emitted.',
  },
];
