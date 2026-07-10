// Bevia.node.ts — action node.
//
// Polymorphic Resource/Operation node. Each operation maps to a
// single Bevia edge function call. The endpoints already plumb SPE
// charge/settle correctly (see
// supabase/functions/zapier-action-*/index.ts); this node is a
// thin transport shim.

import {
  type IDataObject,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeConnectionTypes,
} from 'n8n-workflow';

import { actionProperties, RESOURCE_ENDPOINT } from './description';

interface BeviaCredentials {
  apiToken: string;
  baseUrl: string;
}

function trimBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export class Bevia implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Bevia',
    name: 'bevia',
    icon: 'file:bevia.svg',
    group: ['transform'],
    version: 1,
    description:
      'Run Bevia behavioral reads (drift, coordination, posture) inline, or push captures into the substrate. The brain side of the brain/router split.',
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    defaults: { name: 'Bevia' },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: 'beviaApi', required: true }],
    properties: actionProperties,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const out: INodeExecutionData[] = [];
    const creds = (await this.getCredentials('beviaApi')) as unknown as BeviaCredentials;
    const base = trimBase(creds.baseUrl);

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;
      const slug = RESOURCE_ENDPOINT[resource];
      if (!slug) {
        throw new Error(`Bevia: unknown resource "${resource}"`);
      }

      // Build per-operation request body. Each shape matches the
      // server-side `interface ActionBody`/`ZapierWebhookPayload`
      // for the corresponding edge function.
      const body: IDataObject = {};
      if (resource === 'behavioralReport' && operation === 'generate') {
        const topic = this.getNodeParameter('topic', i, '') as string;
        const entityId = this.getNodeParameter('entityId', i, '') as string;
        const projectSlug = this.getNodeParameter('projectSlug', i, '') as string;
        const timeWindow = this.getNodeParameter('timeWindow', i, 'week') as string;
        if (topic) body.topic = topic;
        if (entityId) body.entity_id = entityId;
        if (projectSlug) body.project_slug = projectSlug;
        body.time_window = timeWindow;
      } else if (resource === 'coordinationAnalysis' && operation === 'run') {
        const projectSlug = this.getNodeParameter('projectSlug', i, '') as string;
        const teamRef = this.getNodeParameter('teamRef', i, '') as string;
        if (projectSlug) body.project_slug = projectSlug;
        if (teamRef) body.team_ref = teamRef;
      } else if (resource === 'updateOrgMemory' && operation === 'update') {
        body.content = this.getNodeParameter('content', i, '') as string;
        body.kind = this.getNodeParameter('kind', i, 'observation') as string;
        body.source_app = this.getNodeParameter('sourceApp', i, 'n8n') as string;
        const sourceUrl = this.getNodeParameter('sourceUrl', i, '') as string;
        const sourceId = this.getNodeParameter('sourceId', i, '') as string;
        const speakerLabel = this.getNodeParameter('speakerLabel', i, '') as string;
        if (sourceUrl) body.source_url = sourceUrl;
        if (sourceId) body.source_id = sourceId;
        if (speakerLabel) body.speaker_label = speakerLabel;
      } else if (resource === 'substrateIntake' && operation === 'send') {
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
      } else {
        throw new Error(`Bevia: unsupported operation "${resource}.${operation}"`);
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
