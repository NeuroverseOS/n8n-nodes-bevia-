// Bevia.node.ts — action node.
//
// Polymorphic Resource/Operation node. Each operation maps to a
// single Bevia edge function call (always POST). The endpoints own
// SPE charge/settle and governance; this node is a thin transport
// shim usable by a person building a workflow OR by an AI agent
// reading the map before acting and writing observations back.

import {
  type IDataObject,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeConnectionTypes,
} from 'n8n-workflow';

import { actionProperties, OPERATION_ENDPOINT } from './description';

interface BeviaCredentials {
  apiToken: string;
  baseUrl: string;
}

interface BeviaLocalCredentials {
  host: string;
  port: number;
}

function trimBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

/** Merge a parsed JSON blob (or object) into a params bag. Silently
 *  ignores malformed JSON so a single bad expression never aborts the
 *  whole batch — the request still goes out with the typed params. */
function mergeJsonParam(target: IDataObject, raw: unknown): void {
  if (raw === undefined || raw === null || raw === '') return;
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    Object.assign(target, parsed as IDataObject);
  }
}

export class Bevia implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Bevia',
    name: 'bevia',
    icon: 'file:bevia.svg',
    group: ['transform'],
    version: 1,
    description:
      'Read the map of your thinking (territories, changes, landmarks, daily pulse), query it, export it, send content in, and file observations. A coordination wire for a person or an AI agent.',
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    defaults: { name: 'Bevia' },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'beviaApi',
        required: true,
        displayOptions: { show: { connection: ['cloud'] } },
      },
      {
        name: 'beviaLocalEngine',
        required: true,
        displayOptions: { show: { connection: ['local'] } },
      },
    ],
    properties: actionProperties,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const out: INodeExecutionData[] = [];
    const connection = this.getNodeParameter('connection', 0, 'cloud') as string;

    // ── Bevia Local — send into the on-device map ─────────────────
    // The engine's capture door (/intake/capture), authenticated with
    // the paired sensor token the credential exchanged for its code.
    // Same wire shape as every other Local sensor; the engine's
    // normalizer + Pass 0 own everything downstream.
    if (connection === 'local') {
      const lc = (await this.getCredentials('beviaLocalEngine')) as unknown as BeviaLocalCredentials;
      const lbase = `http://${lc.host}:${lc.port}`;
      for (let i = 0; i < items.length; i++) {
        const operation = this.getNodeParameter('operation', i) as string;
        if (operation !== 'send') {
          throw new Error(
            `Bevia: "${operation}" is a Bevia Cloud operation. Bevia Local supports Content → Send today — map reads on Local are coming.`,
          );
        }
        const content = this.getNodeParameter('content', i, '') as string;
        const sourceApp = (this.getNodeParameter('sourceApp', i, 'n8n') as string) || 'n8n';
        const sourceDate = this.getNodeParameter('sourceDate', i, '') as string;
        const sourceId = this.getNodeParameter('sourceId', i, '') as string;
        const sourceUrl = this.getNodeParameter('sourceUrl', i, '') as string;
        const speakerLabel = this.getNodeParameter('speakerLabel', i, '') as string;

        const nowIso = new Date().toISOString();
        const emittedAt = sourceDate ? new Date(sourceDate).toISOString() : nowIso;
        // Continuity default when no upstream id exists: one thread
        // per (source app, calendar day) so a day's sends from the
        // same workflow read as one conversation, not confetti.
        const threadId = sourceId || `n8n:${sourceApp}:${emittedAt.slice(0, 10)}`;

        const capture: IDataObject = {
          conversation: [
            { speaker: speakerLabel || 'user', text: content, emitted_at: emittedAt },
          ],
          source_platform: sourceApp,
          captured_at: nowIso,
          thread_id: threadId,
          source_kind: 'router',
        };
        if (sourceUrl) capture.source_url = sourceUrl;

        const response = await this.helpers.httpRequestWithAuthentication.call(
          this,
          'beviaLocalEngine',
          {
            method: 'POST',
            url: `${lbase}/intake/capture`,
            body: { capture },
            json: true,
          },
        );
        out.push({ json: response as IDataObject });
      }
      return [out];
    }

    // ── Bevia Cloud — the original edge-function surface ──────────
    const creds = (await this.getCredentials('beviaApi')) as unknown as BeviaCredentials;
    const base = trimBase(creds.baseUrl);

    for (let i = 0; i < items.length; i++) {
      const operation = this.getNodeParameter('operation', i) as string;
      const slug = OPERATION_ENDPOINT[operation];
      if (!slug) {
        throw new Error(`Bevia: unknown operation "${operation}"`);
      }

      // Build the per-operation request body. Each shape matches the
      // verified server-side contract for the corresponding endpoint.
      const body: IDataObject = {};

      switch (operation) {
        // ── Map reads ─────────────────────────────────────────
        case 'getMap': {
          const apertureId = this.getNodeParameter('apertureId', i, '') as string;
          const includeArchived = this.getNodeParameter('includeArchived', i, false) as boolean;
          if (apertureId) body.aperture_id = apertureId;
          if (includeArchived) body.include_archived = true;
          break;
        }
        case 'getChanges': {
          body.scope = this.getNodeParameter('scope', i, 'pulse') as string;
          body.limit = this.getNodeParameter('maxEvents', i, 200) as number;
          break;
        }
        case 'runQuery': {
          body.kind = this.getNodeParameter('kind', i, 'recent_moments') as string;
          const params: IDataObject = {};
          mergeJsonParam(params, this.getNodeParameter('extraParams', i, '{}'));
          const window = this.getNodeParameter('window', i, '') as string;
          const resultCount = this.getNodeParameter('resultCount', i, 0) as number;
          if (window) params.window = window;
          if (resultCount && resultCount > 0) params.limit = resultCount;
          body.params = params;
          break;
        }
        case 'getLandmarks': {
          const continentId = this.getNodeParameter('continentId', i, '') as string;
          if (!continentId) {
            throw new Error('Bevia: Continent ID is required for Get Landmarks.');
          }
          body.continent_id = continentId;
          body.per_territory_cap = this.getNodeParameter('perTerritoryCap', i, 6) as number;
          break;
        }
        case 'getDailyPulse': {
          body.quadrant = this.getNodeParameter('quadrant', i, 'briefing') as string;
          break;
        }
        case 'exportSubstrate': {
          const view = this.getNodeParameter('view', i, 'raw') as string;
          body.view = view;
          if (view === 'interpretive') {
            body.format = this.getNodeParameter('format', i, 'chat') as string;
          }
          const since = this.getNodeParameter('since', i, '') as string;
          if (since) body.since = since;
          body.limit = this.getNodeParameter('maxRecords', i, 10000) as number;
          if (this.getNodeParameter('acknowledge', i, false) as boolean) {
            body.acknowledge = true;
          }
          break;
        }

        // ── Content intake ────────────────────────────────────
        case 'send': {
          body.content = this.getNodeParameter('content', i, '') as string;
          body.source_app = this.getNodeParameter('sourceApp', i, 'n8n') as string;
          const sourceDate = this.getNodeParameter('sourceDate', i, '') as string;
          const sourceId = this.getNodeParameter('sourceId', i, '') as string;
          const sourceUrl = this.getNodeParameter('sourceUrl', i, '') as string;
          const speakerLabel = this.getNodeParameter('speakerLabel', i, '') as string;
          if (sourceDate) body.source_date = sourceDate;
          if (sourceId) body.source_id = sourceId;
          if (sourceUrl) body.source_url = sourceUrl;
          if (speakerLabel) body.speaker_label = speakerLabel;
          break;
        }

        // ── Note write-back ───────────────────────────────────
        case 'add': {
          body.content = this.getNodeParameter('content', i, '') as string;
          body.kind = this.getNodeParameter('kind', i, 'observation') as string;
          body.source_app = this.getNodeParameter('sourceApp', i, 'n8n') as string;
          const sourceUrl = this.getNodeParameter('sourceUrl', i, '') as string;
          const sourceId = this.getNodeParameter('sourceId', i, '') as string;
          const speakerLabel = this.getNodeParameter('speakerLabel', i, '') as string;
          if (sourceUrl) body.source_url = sourceUrl;
          if (sourceId) body.source_id = sourceId;
          if (speakerLabel) body.speaker_label = speakerLabel;
          break;
        }

        default:
          throw new Error(`Bevia: unsupported operation "${operation}"`);
      }

      const response = await this.helpers.httpRequest({
        method: 'POST',
        url: `${base}/${slug}`,
        headers: {
          Authorization: `Bearer ${creds.apiToken}`,
          'Content-Type': 'application/json',
        },
        body,
        json: true,
      });

      out.push({ json: response as IDataObject });
    }

    return [out];
  }
}
