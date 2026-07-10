// BeviaTrigger.node.ts — polling trigger node.
//
// Doctrine (ADR-0054, CLAUDE.md § Pull-not-push): n8n polls Bevia;
// Bevia never pushes. On each poll this node reads
// POST /trajectory-events (scope=pulse — the last 24h of changes to
// the principal's map), filters to the selected event kind, dedupes
// against the ids it has already emitted, and returns only new items.
//
// Dedup + baseline:
//   - `seenIds` is a bounded ring of trajectory_event ids already
//     emitted. Ids come from the trajectory_event table and are
//     stable across polls (compute-if-missing persists rows before
//     re-fetching), so id-dedup is exact.
//   - The FIRST live poll establishes a baseline (records the ids
//     currently in the window and emits nothing) so activating a
//     workflow does not replay up to 24h of history.
//   - Manual/test execution returns the single most-recent matching
//     event as a sample without advancing state, so the user can see
//     the shape immediately.
//
// Zero runtime dependencies — Node builtins + n8n-workflow only.

import {
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  type IPollFunctions,
  NodeConnectionTypes,
} from 'n8n-workflow';

import { triggerProperties } from './description';

interface BeviaCredentials {
  apiToken: string;
  baseUrl: string;
}

interface TrajectoryEvent {
  id: string;
  event_kind: string;
  subject_kind?: string;
  subject_id?: string;
  subject_label?: string | null;
  magnitude?: number | null;
  detected_at: string;
  [key: string]: unknown;
}

interface TrajectoryEventsResponse {
  ok?: boolean;
  events?: TrajectoryEvent[];
  [key: string]: unknown;
}

interface TriggerStaticData {
  /** Ring of trajectory_event ids already emitted (dedup key). */
  seenIds?: string[];
  /** True once the first live poll has recorded a baseline. */
  initialized?: boolean;
}

const SEEN_RING_LIMIT = 1000;

function trimBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export class BeviaTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Bevia Trigger',
    name: 'beviaTrigger',
    icon: 'file:beviaTrigger.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{"Event: " + $parameter["event"]}}',
    description:
      'Polls Bevia for changes to the map of your thinking — new territories, growth, dormancy, revival, continents, worldview shifts.',
    defaults: { name: 'Bevia Trigger' },
    polling: true,
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: 'beviaApi', required: true }],
    properties: triggerProperties,
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    const staticData = this.getWorkflowStaticData('node') as TriggerStaticData;
    const eventFilter = this.getNodeParameter('event', 'cluster_formed') as string;
    const creds = (await this.getCredentials('beviaApi')) as unknown as BeviaCredentials;
    const base = trimBase(creds.baseUrl);

    const response = (await this.helpers.httpRequest({
      method: 'POST',
      url: `${base}/trajectory-events`,
      headers: {
        Authorization: `Bearer ${creds.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: { scope: 'pulse', offset: 0, limit: 200 },
      json: true,
    })) as TrajectoryEventsResponse;

    const allEvents = Array.isArray(response?.events) ? response.events : [];

    // Filter to the selected kind (or keep everything for 'all').
    const matching = allEvents.filter(
      (e) => e && typeof e.id === 'string' && (eventFilter === 'all' || e.event_kind === eventFilter),
    );

    // Oldest-first so the workflow receives events in the order they
    // were detected.
    matching.sort(
      (a, b) => new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime(),
    );

    // Manual / test execution: return the most recent matching event
    // as a sample without touching persisted state.
    if (this.getMode() === 'manual') {
      if (matching.length === 0) return null;
      const latest = matching[matching.length - 1];
      return [[{ json: latest as unknown as IDataObject }]];
    }

    const seen = (staticData.seenIds ??= []);

    const recordSeen = (ids: string[]): void => {
      for (const id of ids) seen.push(id);
      while (seen.length > SEEN_RING_LIMIT) seen.shift();
    };

    // First live poll: record a baseline and emit nothing, so
    // activation does not replay the existing window as "new".
    if (!staticData.initialized) {
      staticData.initialized = true;
      recordSeen(matching.map((e) => e.id));
      return null;
    }

    const fresh = matching.filter((e) => !seen.includes(e.id));
    if (fresh.length === 0) return null;

    recordSeen(fresh.map((e) => e.id));

    return [fresh.map((e) => ({ json: e as unknown as IDataObject }))];
  }
}
