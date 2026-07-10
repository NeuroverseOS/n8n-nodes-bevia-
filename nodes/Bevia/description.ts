// Bevia action node — UI description.
//
// Resource / Operation pattern. Resources map to the existing
// /zapier-action-* and /zapier-intake endpoints; operations are the
// verbs available on each resource.

import type { INodeProperties } from 'n8n-workflow';

import { behavioralReportProperties } from './operations/behavioralReport';
import { coordinationAnalysisProperties } from './operations/coordinationAnalysis';
import { updateOrgMemoryProperties } from './operations/updateOrgMemory';
import { substrateIntakeProperties } from './operations/substrateIntake';

export const RESOURCE_ENDPOINT: Record<string, string> = {
  behavioralReport: 'zapier-action-behavioral-report',
  coordinationAnalysis: 'zapier-action-coordination-analysis',
  updateOrgMemory: 'zapier-action-update-org-memory',
  substrateIntake: 'zapier-intake',
};

export const actionProperties: INodeProperties[] = [
  {
    displayName: 'Resource',
    name: 'resource',
    type: 'options',
    noDataExpression: true,
    default: 'behavioralReport',
    options: [
      {
        name: 'Behavioral Report',
        value: 'behavioralReport',
        description: 'Read drift, pulse, posture, and recovery for a project, entity, or topic.',
      },
      {
        name: 'Coordination Analysis',
        value: 'coordinationAnalysis',
        description: 'Read the coordination shape of a project or team.',
      },
      {
        name: 'Organizational Memory',
        value: 'updateOrgMemory',
        description: 'File a doctrine candidate, observation, or commitment for operator review.',
      },
      {
        name: 'Substrate Intake',
        value: 'substrateIntake',
        description: 'Send a conversation from anywhere into the Bevia substrate.',
      },
    ],
  },

  // Behavioral Report operations
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    default: 'generate',
    displayOptions: { show: { resource: ['behavioralReport'] } },
    options: [
      {
        name: 'Generate',
        value: 'generate',
        description: 'Generate a behavioral report inline.',
        action: 'Generate a behavioral report',
      },
    ],
  },

  // Coordination Analysis operations
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    default: 'run',
    displayOptions: { show: { resource: ['coordinationAnalysis'] } },
    options: [
      {
        name: 'Run',
        value: 'run',
        description: 'Run a coordination analysis inline.',
        action: 'Run a coordination analysis',
      },
    ],
  },

  // Organizational Memory operations
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    default: 'update',
    displayOptions: { show: { resource: ['updateOrgMemory'] } },
    options: [
      {
        name: 'Update',
        value: 'update',
        description: 'File a doctrine / observation / commitment candidate.',
        action: 'Update organizational memory',
      },
    ],
  },

  // Substrate Intake operations
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    default: 'send',
    displayOptions: { show: { resource: ['substrateIntake'] } },
    options: [
      {
        name: 'Send Conversation',
        value: 'send',
        description: 'Send a conversation into the Bevia substrate.',
        action: 'Send a conversation into the substrate',
      },
    ],
  },

  // Per-operation property descriptions.
  ...behavioralReportProperties,
  ...coordinationAnalysisProperties,
  ...updateOrgMemoryProperties,
  ...substrateIntakeProperties,
];
