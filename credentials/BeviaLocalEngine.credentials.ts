// BeviaLocalEngine credential — pair n8n with a Bevia Local engine.
//
// Bevia Local runs entirely on the user's machine; there is no API
// token to mint. Pairing works like every other Bevia sensor: the
// desktop app shows a PORT and a short-lived CODE (Apps → n8n →
// "Show a pairing code"), the user types both here, and on first use
// this credential exchanges the code for a long-lived sensor token
// via POST /pair. The token is stored by n8n in the hidden expirable
// field below (the same session-token pattern n8n's own Metabase
// credential uses); the one-shot code is never needed again.
//
// If the engine is ever un-paired (token revoked), requests 401 and
// n8n re-runs the exchange — which fails on the spent code, so the
// user gets a fresh code from the app and updates this credential.
// That's the honest recovery path, stated in the field description.
//
// Self-hosted n8n only: n8n Cloud cannot reach a machine on your
// desk. Host defaults to 127.0.0.1 (n8n on the same machine); set a
// LAN address if n8n runs on another box you control.

import type {
  IAuthenticateGeneric,
  ICredentialDataDecryptedObject,
  ICredentialTestRequest,
  ICredentialType,
  IHttpRequestHelper,
  INodeProperties,
} from 'n8n-workflow';

export class BeviaLocalEngine implements ICredentialType {
  name = 'beviaLocalEngine';
  displayName = 'Bevia Local Engine';
  documentationUrl = 'https://github.com/NeuroverseOS/n8n-nodes-bevia-#readme';

  properties: INodeProperties[] = [
    {
      displayName: 'Host',
      name: 'host',
      type: 'string',
      default: '127.0.0.1',
      required: true,
      description:
        'Where the Bevia Local engine runs. Keep 127.0.0.1 when n8n runs on the same machine; use a LAN address for another machine you control.',
    },
    {
      displayName: 'Port',
      name: 'port',
      type: 'number',
      default: 0,
      required: true,
      description: 'The Port shown in the Bevia app under Apps → n8n → "Show a pairing code".',
    },
    {
      displayName: 'Pairing Code',
      name: 'pairingCode',
      type: 'string',
      default: '',
      required: true,
      description:
        'The one-time Code shown next to the Port. It is exchanged for a long-lived connection on first use. If Bevia ever shows this connection as un-paired, get a fresh code and update this field.',
    },
    // Filled by preAuthentication with the sensor token /pair returns.
    // expirable: on a 401 n8n re-runs the exchange automatically.
    {
      displayName: 'Session Token',
      name: 'sessionToken',
      type: 'hidden',
      typeOptions: { expirable: true },
      default: '',
    },
  ];

  // Exchange the one-time pairing code for the engine's sensor token.
  async preAuthentication(
    this: IHttpRequestHelper,
    credentials: ICredentialDataDecryptedObject,
  ): Promise<{ sessionToken: string }> {
    const host = String(credentials.host ?? '127.0.0.1');
    const port = Number(credentials.port ?? 0);
    const res = (await this.helpers.httpRequest({
      method: 'POST',
      url: `http://${host}:${port}/pair`,
      body: {
        code: String(credentials.pairingCode ?? ''),
        name: 'n8n',
        kind: 'n8n',
      },
      json: true,
    })) as { token?: string };
    if (!res?.token) {
      throw new Error(
        'Bevia Local pairing failed — get a fresh code from the Bevia app (Apps → n8n) and update this credential.',
      );
    }
    return { sessionToken: res.token };
  }

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.sessionToken}}',
      },
    },
  };

  // /health is the engine's cheap liveness read — proves host+port
  // point at a running engine. (Auth is proven on first real send,
  // which performs the code exchange.)
  test: ICredentialTestRequest = {
    request: {
      method: 'GET',
      baseURL: '=http://{{$credentials.host}}:{{$credentials.port}}',
      url: '/health',
    },
  };
}
