# n8n-nodes-bevia

Community node package for [Bevia](https://bevia.co) — the behavioral
interpretation layer for humans and AI agents working together.
**Bevia is the brain; n8n is the router.** This package is the
surface that makes the third leg cheap to wire.

It exposes two nodes:

- **Bevia Trigger** — listens for the events Bevia emits as your
  map moves (territories emerging, growing, going dormant, reviving,
  being promoted; continents forming; worldview shifts) plus the
  behavioral signals (commitment drift, card lifecycle, repair,
  posture, doctrine). Polymorphic; pick the event you care about
  from a dropdown.
- **Bevia** — calls Bevia inline to generate behavioral reports,
  run coordination analyses, file doctrine candidates, or push
  conversations into the substrate from anywhere n8n can reach.

## What this is not

Bevia is **not** a hosted-orchestration company. You bring your own
n8n (self-hosted or n8n.cloud), install this node, and wire your
own workflows. This package is the integration surface, not a
managed product.

If you want a workflow you can drop in unchanged, the starter
templates ship at
[`docs/observer-templates/workflows/`](https://github.com/RegardsKiki2/bevia-your-ai-co-pilot/tree/main/docs/observer-templates/workflows)
in the main Bevia repo. Import any of them into your n8n instance.

## Install

### n8n.cloud / self-hosted via the GUI

1. Open **Settings → Community Nodes** in your n8n instance.
2. Click **Install**, paste `n8n-nodes-bevia`, accept the risk
   notice (n8n requires it for any community node), and submit.
3. Reload. The **Bevia Trigger** and **Bevia** nodes appear in
   the node picker.

### Self-hosted via the filesystem

```bash
cd ~/.n8n/custom
npm install n8n-nodes-bevia
# restart n8n
```

## Authenticate

1. Open `/app/credentials` in your Bevia account.
2. Under the **n8n** section, click **Generate token**. Bevia mints
   a `bvex_n8n_<...>` token and shows it once.
3. In n8n, create a new **Bevia API** credential and paste the
   token. The default base URL points at Bevia's production
   tenant; change it only if you're running a self-hosted Bevia.
4. Click **Test** — Bevia responds 200 on `/my-usage` for any live
   token.

(Legacy: `bvex_zapier_*` tokens minted before the n8n surface
existed still work end-to-end. New workflows should mint an
n8n-surface token so revocation lives on the right tab.)

## Triggers

One polymorphic node. The **Event** dropdown picks which Bevia
event the workflow listens for:

| Display label | Underlying event | Auto-subscribe |
| --- | --- | --- |
| On Trajectory Changed | `trajectory.changed` | yes |
| On Risk Threshold Crossed | `risk.threshold_crossed` | yes |
| On Repair Detected | `repair.detected` | yes |
| On Alignment Shifted | `alignment.shifted` | yes |
| On Posture Shifted | `posture.shifted` | yes |
| On Commitment Drifted | `commitment.drifted` | yes |
| On Doctrine Ratified | `doctrine.ratified` | yes |
| On Card Emitted (advanced) | `card.emitted` — filterable by card kind | yes |
| On Continuity Updated (advanced) | `continuity.updated` | yes |
| On Verification Insufficient (advanced) | `verification.insufficient` | yes |
| On Drift Alert (legacy) | `drift.threshold_crossed` (deprecated; use Risk Threshold Crossed) | yes |

Activation calls Bevia's REST-Hooks subscribe endpoint with the
generated n8n webhook URL. Deactivation unsubscribes.

Each delivery is verified via `X-Bevia-Signature` (HMAC-SHA256)
and deduplicated on `X-Bevia-Delivery-Id`. Replays reuse both ids.
See [`docs/specs/bevia-outbound-event-schema.md`](https://github.com/RegardsKiki2/bevia-your-ai-co-pilot/blob/main/docs/specs/bevia-outbound-event-schema.md)
for the full wire contract.

## Actions

Resource / Operation pattern:

| Resource | Operation | Endpoint |
| --- | --- | --- |
| Behavioral Report | Generate | `POST /zapier-action-behavioral-report` |
| Coordination Analysis | Run | `POST /zapier-action-coordination-analysis` |
| Organizational Memory | Update | `POST /zapier-action-update-org-memory` |
| Substrate Intake | Send Conversation | `POST /zapier-intake` |

Action endpoints are SPE-plumbed on the server side — Bevia bills
the user's BYOK provider directly for the inline AI calls. The
node does no AI work itself.

## Example workflows

The Bevia repo ships six starter workflows under
[`docs/observer-templates/workflows/`](https://github.com/RegardsKiki2/bevia-your-ai-co-pilot/tree/main/docs/observer-templates/workflows):

- AI Builder Memory
- AI Project Drift Detector
- Commitment Follow-Through Tracker
- Founder Cognitive Overload
- Meeting Behavioral Signal
- Silent Stakeholder Risk

Import any of them into n8n (**Workflows → Import from File**) and
edit credentials + downstream nodes for your stack.

## License

MIT. Bevia is open about how the node wires together; the brain
side (substrate, interpretation, doctrine) is the proprietary
part.

## Support

- Spec: [`docs/specs/bevia-n8n-community-node.md`](https://github.com/RegardsKiki2/bevia-your-ai-co-pilot/blob/main/docs/specs/bevia-n8n-community-node.md)
- Event schema: [`docs/specs/bevia-outbound-event-schema.md`](https://github.com/RegardsKiki2/bevia-your-ai-co-pilot/blob/main/docs/specs/bevia-outbound-event-schema.md)
- Issues / questions: file an issue on the Bevia repo.
