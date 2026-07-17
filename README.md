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

You authenticate with a single per-user Bevia API token pasted into the
**Bevia API** credential. Mint an **n8n** token (a `bvex_n8n_…` token)
from **Settings → Tokens → n8n** in your Bevia account. One n8n token
covers everything this node does — the read/query/export/poll actions
**and** the *Send Content* / *Add a Note* writes.

Paste the token into the credential's **API Token** field; the default
base URL points at Bevia's production tenant
(`https://api.bevia.co/functions/v1`) — change it only if you're running
a self-hosted Bevia.

> **Verify before publishing:** the single-credential story above relies
> on the server-side auth change that lets an `n8n`-surface token
> authenticate the read/poll endpoints (not only the intake/note
> endpoints). Confirm that change is deployed on your Bevia tenant, then
> test one read action and one write action with the same token before
> relying on it. (On an older tenant that hasn't shipped that change,
> reads would still require a separate MCP `bvma_…` token.)

### Bevia Local (map on your own machine)

Running **Bevia Local** instead of (or alongside) cloud? The Bevia node
can send content straight into the engine on your machine — Slack,
Gmail, Notion, anything an n8n workflow reads becomes part of your
local map, and nothing touches Bevia's servers.

1. In the node, set **Connect To → Bevia Local**.
2. Create a **Bevia Local Engine** credential. In the Bevia desktop app
   open **Apps → n8n → "Show a pairing code"** and copy the **Port**
   and **Code** into the credential. The one-time code is exchanged for
   a long-lived connection on first use.
3. Use **Content → Send** — that's the supported operation on Local
   today (map reads on Local are coming). If Bevia ever shows the
   connection as un-paired, grab a fresh code and update the credential.

Self-hosted n8n only: n8n Cloud cannot reach a machine on your desk.
Host defaults to `127.0.0.1`; set a LAN address if n8n runs on another
machine you control.

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
