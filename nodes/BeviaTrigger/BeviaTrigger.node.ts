// BeviaTrigger.node.ts — webhook-trigger node.
//
// Flow:
//   1. Workflow activates → n8n calls webhookMethods.default.create.
//      We POST to <baseUrl>/<event-slug>/subscribe with the n8n
//      webhook URL and store { subscription_id, signing_secret } on
//      the node's workflow staticData.
//   2. Each incoming delivery hits the webhook() method. We verify
//      the X-Bevia-Signature HMAC, dedupe on X-Bevia-Delivery-Id
//      (small ring buffer on staticData), and emit one n8n item.
//   3. Workflow deactivates → webhookMethods.default.delete POSTs
//      to /unsubscribe.
//
// Events without an auto-subscribe endpoint fall back to "manual
// webhook" mode: the node still emits deliveries correctly, but
// activation does not call /subscribe — the user must add the
// webhook URL in /app/output/webhooks. The README documents the
// fallback.
//
// Wire contract: docs/specs/bevia-outbound-event-schema.md.

import {
  type IDataObject,
  type IHookFunctions,
  type INodeType,
  type INodeTypeDescription,
  type IWebhookFunctions,
  type IWebhookResponseData,
  NodeConnectionTypes,
} from 'n8n-workflow';
import * as crypto from 'crypto';

import { triggerProperties, EVENT_SLUG, EVENT_HAS_AUTO_SUBSCRIBE } from './description';

interface BeviaCredentials {
  apiToken: string;
  baseUrl: string;
}

interface StaticData {
  subscriptionId?: string;
  signingSecret?: string;
  deliveryRing?: string[];
}

const DELIVERY_RING_LIMIT = 256;

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function buildEndpoint(baseUrl: string, slug: string, suffix: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  return `${trimmed}/${slug}/${suffix}`;
}

export class BeviaTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Bevia Trigger',
    name: 'beviaTrigger',
    icon: 'file:beviaTrigger.svg',
    group: ['trigger'],
    version: 1,
    description:
      'Listens for behavioral signals emitted by Bevia — drift, repair, posture, commitment, doctrine. The brain side of the brain/router split.',
    defaults: { name: 'Bevia Trigger' },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: 'beviaApi', required: true }],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: triggerProperties,
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        const staticData = this.getWorkflowStaticData('node') as StaticData;
        return Boolean(staticData.subscriptionId);
      },

      async create(this: IHookFunctions): Promise<boolean> {
        const event = this.getNodeParameter('event') as string;
        const slug = EVENT_SLUG[event];
        if (!slug) {
          throw new Error(`Bevia Trigger: unknown event "${event}"`);
        }

        // Events without an automatic subscribe endpoint still
        // need a working webhook — we just skip the /subscribe
        // call and ask the user to wire the URL manually. n8n
        // still exposes the webhook URL for them to paste.
        if (!EVENT_HAS_AUTO_SUBSCRIBE.has(event)) {
          // Best-effort guidance — show on workflow activation log.
          // (n8n surfaces logger output in the executions panel.)
          this.logger.info(
            `Bevia Trigger: event "${event}" has no automatic subscribe endpoint yet. ` +
              `Add a webhook in /app/output/webhooks pointing at ${this.getNodeWebhookUrl(
                'default',
              )} — automatic subscription lands in the next release.`,
          );
          return true;
        }

        const creds = (await this.getCredentials('beviaApi')) as unknown as BeviaCredentials;
        const webhookUrl = this.getNodeWebhookUrl('default');

        const response = (await this.helpers.httpRequest({
          method: 'POST',
          url: buildEndpoint(creds.baseUrl, slug, 'subscribe'),
          headers: { Authorization: `Bearer ${creds.apiToken}` },
          body: { target_url: webhookUrl },
          json: true,
        })) as { subscription_id?: string; signing_secret?: string };

        if (!response?.subscription_id) {
          throw new Error(
            `Bevia Trigger: subscribe failed for "${event}" — no subscription_id returned`,
          );
        }

        const staticData = this.getWorkflowStaticData('node') as StaticData;
        staticData.subscriptionId = response.subscription_id;
        staticData.signingSecret = response.signing_secret;
        staticData.deliveryRing = [];
        return true;
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const staticData = this.getWorkflowStaticData('node') as StaticData;
        const subscriptionId = staticData.subscriptionId;
        if (!subscriptionId) return true;

        const event = this.getNodeParameter('event') as string;
        const slug = EVENT_SLUG[event];
        if (!slug || !EVENT_HAS_AUTO_SUBSCRIBE.has(event)) {
          // Manual-mode subscriptions don't have anything to call.
          delete staticData.subscriptionId;
          delete staticData.signingSecret;
          return true;
        }

        const creds = (await this.getCredentials('beviaApi')) as unknown as BeviaCredentials;
        try {
          await this.helpers.httpRequest({
            method: 'POST',
            url: buildEndpoint(creds.baseUrl, slug, 'unsubscribe'),
            headers: { Authorization: `Bearer ${creds.apiToken}` },
            body: { subscription_id: subscriptionId },
            json: true,
          });
        } catch (err) {
          // Best-effort. A 404 here means the row was already
          // deleted server-side; we still clear local state.
          this.logger.warn(
            `Bevia Trigger: unsubscribe call failed (${(err as Error).message}) — clearing local state anyway.`,
          );
        }

        delete staticData.subscriptionId;
        delete staticData.signingSecret;
        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const staticData = this.getWorkflowStaticData('node') as StaticData;
    const req = this.getRequestObject();
    const headers = (req.headers ?? {}) as Record<string, string | string[] | undefined>;
    const event = this.getNodeParameter('event') as string;

    const deliveryId = String(headers['x-bevia-delivery-id'] ?? '').trim();
    const signature = String(headers['x-bevia-signature'] ?? '').trim();
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body ?? {});

    // 1. Signature verification.
    if (staticData.signingSecret && signature) {
      if (!signature.startsWith('sha256=')) {
        return { workflowData: [] };
      }
      const expected = crypto
        .createHmac('sha256', staticData.signingSecret)
        .update(rawBody)
        .digest('hex');
      const provided = signature.slice('sha256='.length);
      if (!timingSafeEqualHex(expected, provided)) {
        return { workflowData: [] };
      }
    }

    // 2. Dedupe on delivery id (replays reuse the same id).
    if (deliveryId) {
      const ring = (staticData.deliveryRing ??= []);
      if (ring.includes(deliveryId)) {
        return { workflowData: [] };
      }
      ring.push(deliveryId);
      while (ring.length > DELIVERY_RING_LIMIT) ring.shift();
    }

    // 3. Optional card-kind filter (only for card.emitted).
    const body = (req.body ?? {}) as IDataObject;
    if (event === 'card.emitted') {
      const kindFilter = this.getNodeParameter('cardKindFilter', []) as string[];
      if (kindFilter.length > 0) {
        const cardKind = ((body.data as IDataObject | undefined)?.card as IDataObject | undefined)
          ?.kind as string | undefined;
        if (!cardKind || !kindFilter.includes(cardKind)) {
          return { workflowData: [] };
        }
      }
    }

    return {
      workflowData: [[{ json: body }]],
    };
  }
}
