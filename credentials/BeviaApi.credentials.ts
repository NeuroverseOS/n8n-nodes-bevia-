// BeviaApi credential — single API token, optional base URL.
//
// The token is minted at /app/credentials in the Bevia UI. Two
// surfaces exist on the server side:
//   - bvex_zapier_*  (legacy: works for both Zapier and n8n)
//   - bvex_n8n_*     (preferred: minted under the n8n tab)
//
// Either form is accepted by the REST-Hooks endpoints and the
// /zapier-action-* endpoints during the rollout window.
// Reference: docs/specs/bevia-n8n-community-node.md § 5.

import type {
  ICredentialType,
  INodeProperties,
  ICredentialTestRequest,
  IAuthenticateGeneric,
} from 'n8n-workflow';

export class BeviaApi implements ICredentialType {
  name = 'beviaApi';
  displayName = 'Bevia API';
  documentationUrl = 'https://github.com/NeuroverseOS/n8n-nodes-bevia#readme';

  properties: INodeProperties[] = [
    {
      displayName: 'API Token',
      name: 'apiToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description:
        'A per-user Bevia API token starting with bvex_zapier_ or bvex_n8n_. Mint one at /app/credentials in your Bevia account.',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://api.bevia.co/functions/v1',
      required: true,
      description:
        'Base URL for Bevia edge functions. Defaults to the production tenant; change only if you are running a self-hosted Bevia.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiToken}}',
      },
    },
  };

  // n8n hits this when the user clicks "Test" on the credential
  // editor. /my-usage is a cheap GET that 200s for any live bvex_
  // token regardless of surface and 401s otherwise.
  test: ICredentialTestRequest = {
    request: {
      method: 'GET',
      baseURL: '={{$credentials.baseUrl}}',
      url: '/my-usage',
    },
  };
}
