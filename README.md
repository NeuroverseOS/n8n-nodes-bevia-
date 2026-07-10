# n8n-nodes-bevia

This is an [n8n community node](https://docs.n8n.io/integrations/community-nodes/).
It lets you use [Bevia](https://bevia.co) in your n8n workflows.

Bevia builds a **map of your thinking** — the ideas, landmarks, and
territories that emerge from the work you do across your tools and AI
surfaces. This node is a coordination wire onto that map: read it,
query it, export it, react to it changing, send new content into it,
and file observations back.

**Bevia is the brain; n8n is the router.** This package is the surface
that makes the wiring cheap.

It exposes two nodes:

- **Bevia Trigger** — a polling trigger. n8n asks Bevia "what changed
  on my map?" on a schedule and fires when a new territory forms, grows,
  goes quiet, comes back, a continent forms, a worldview shifts, or a
  territory gets promoted.
- **Bevia** — actions that read the map (territories, changes,
  landmarks, daily pulse), run a typed query, export your substrate,
  send content into Bevia, or file a note/observation.

## Use it from an agent

The same actions make this node a coordination wire for an **AI agent**,
not just a person clicking through a workflow. An agent can:

- **Read the map before it acts** — call *Get Map*, *Query Map*, or
  *Get What Changed* so its next step is grounded in what you've
  actually been thinking about, not just the current prompt.
- **React to the map changing** — put the **Bevia Trigger** ahead of an
  agent step so a new territory or a worldview shift kicks off work.
- **Write observations back** — call *Add a Note or Observation* (or
  *Send Content*) so what the agent notices re-enters the substrate for
  next time.

Read → act → write, on a shared map. That is the loop the node exists to
close, whether the thing driving it is a human or a model.

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

You authenticate with a per-user Bevia API token pasted into the
**Bevia API** credential. Two token surfaces exist, and — importantly —
they cover **different** endpoints:

| You want to… | Mint a token of surface… |
| --- | --- |
| Read/Query/Export the map, poll for changes (**Bevia Trigger**, and the *Get Map / Get What Changed / Query Map / Get Landmarks / Get Daily Pulse / Export Substrate* actions) | **MCP** (a `bvma_…` token) |
| Send content in / file a note (*Send Content*, *Add a Note or Observation*) | **n8n** (or **Zapier**) — a `bvex_n8n_…` / `bvex_zapier_…` token |

Mint tokens at `/app/credentials` (intake surface) and **Settings →
Tokens** (MCP surface) in your Bevia account. Paste the token into the
credential's **API Token** field; the default base URL points at Bevia's
production tenant (`https://api.bevia.co/functions/v1`) — change it only
if you're running a self-hosted Bevia.

> **Heads-up (verify before publishing):** a single token surface does
> not currently cover both the read/poll endpoints and the intake/note
> endpoints. If a workflow does both, use two **Bevia API** credentials
> (one MCP token, one intake token) and point each node at the right
> one. Test with a real token before relying on it.

## Trigger

**Bevia Trigger** is a **polling** trigger — n8n polls Bevia on the
schedule you set in the node's **Poll Times**; Bevia never pushes. Each
poll reads the recent change stream for your map and emits only events
the workflow hasn't seen yet (deduplicated by event id). The first poll
after you activate a workflow records a baseline and emits nothing, so
you don't get a backlog replayed at you.

Pick what to react to in the **Event** dropdown:

| Event | Fires when |
| --- | --- |
| New Territory Formed (default) | a new territory takes shape |
| Territory Grew | a territory gains new evidence |
| Territory Went Quiet | an active territory goes dormant |
| Territory Came Back | a dormant territory reactivates |
| Continent Formed | related territories cohere into a continent |
| Worldview Shifted | a high-level worldview shifts |
| Territory Promoted | a territory crosses the promotion threshold |
| All Events | any of the above |

## Actions

The **Bevia** node groups actions under three resources:

| Resource | Operation | Endpoint | What it returns / does |
| --- | --- | --- | --- |
| Map | Get Map | `POST /territories-readout` | the territories the map currently sees |
| Map | Get What Changed | `POST /trajectory-events` | recent changes (new / grown / dormant / revived …) |
| Map | Query Map | `POST /query-run` | a typed question over the map (recent moments, contradictions, grown territories, recent ideas, and more) |
| Map | Get Landmarks | `POST /continent-landmarks-readout` | the landmark history for one continent (needs a Continent ID) |
| Map | Get Daily Pulse | `POST /compile-pulse` | the daily pulse — what to know today |
| Map | Export Substrate | `POST /export-substrate` | a portable copy of your substrate |
| Content | Send | `POST /zapier-intake` | sends content into the substrate |
| Note | Add | `POST /zapier-action-update-org-memory` | files an observation / commitment / doctrine candidate |

Notes:

- **Query Map** takes a *Query* kind plus optional *Window* (`7d`,
  `30d`, `24h`), *Result Count*, and *Extra Parameters* (JSON). Queries
  that need an id (e.g. *Territory Detail*) take it via Extra Parameters,
  e.g. `{"territory_id":"…"}`.
- **Export Substrate** defaults to the *Raw (Portable Substrate Bundle)*
  view. The first export requires **Acknowledge Export** to be on
  (Bevia's one-time egress acknowledgment). Export is free at every tier.
- The read actions are pure substrate reads (no AI billing). *Send* and
  *Add* run Bevia's server-side pipeline, which is SPE-plumbed — the node
  does no AI work itself.

## Compatibility

- **Minimum n8n version:** 1.40.0 (the node targets `n8nNodesApiVersion: 1`
  and `n8n-workflow` ≥ 1.40.0).
- **Node.js:** 18.10 or later (matches n8n's own runtime requirement).
- The node uses only stable `n8n-workflow` APIs (`INodeType`,
  `IExecuteFunctions`, `IPollFunctions`) and Node builtins — zero runtime
  dependencies.

## License

MIT. Bevia is open about how the node wires together; the brain
side (substrate, interpretation, doctrine) is the proprietary
part.

## Support

- Spec: [`docs/specs/bevia-n8n-community-node.md`](https://github.com/NeuroverseOS/bevia-your-ai-co-pilot/blob/main/docs/specs/bevia-n8n-community-node.md)
- Issues / questions: file an issue on the Bevia repo.
