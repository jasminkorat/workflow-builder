import { z } from 'zod'
import type { NodeDefinition } from '../types'

export const nodeDefinitions: NodeDefinition[] = [
  // TRIGGERS
  {
    type: 'manual-trigger',
    category: 'trigger',
    label: 'Manual Trigger',
    description: 'Start workflow manually',
    icon: '▶️',
    color: '#10b981',
    inputs: 0,
    outputs: 1,
    fields: [
      {
        name: 'triggerName',
        label: 'Trigger Name',
        type: 'text',
        placeholder: 'e.g., Start Process',
        required: true,
        validation: z.string().min(1, 'Name is required')
      }
    ],
    defaultConfig: { triggerName: 'Manual Start' }
  },
  {
    type: 'webhook-trigger',
    category: 'trigger',
    label: 'Webhook Trigger',
    description: 'Trigger from webhook',
    icon: '🔗',
    color: '#10b981',
    inputs: 0,
    outputs: 1,
    fields: [
      {
        name: 'webhookUrl',
        label: 'Webhook URL',
        type: 'text',
        placeholder: 'https://example.com/webhook',
        required: true,
        validation: z.string().url('Must be a valid URL')
      },
      {
        name: 'method',
        label: 'HTTP Method',
        type: 'select',
        required: true,
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'GET', value: 'GET' }
        ],
        validation: z.enum(['POST', 'GET'])
      }
    ],
    defaultConfig: { webhookUrl: '', method: 'POST' }
  },

  // ACTIONS
  {
    type: 'http-action',
    category: 'action',
    label: 'HTTP Request',
    description: 'Make HTTP API call',
    icon: '🌐',
    color: '#3b82f6',
    inputs: 1,
    outputs: 1,
    fields: [
      {
        name: 'url',
        label: 'URL',
        type: 'text',
        placeholder: 'https://api.example.com/endpoint',
        required: true,
        validation: z.string().url('Must be a valid URL')
      },
      {
        name: 'method',
        label: 'Method',
        type: 'select',
        required: true,
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' }
        ],
        validation: z.enum(['GET', 'POST', 'PUT', 'DELETE'])
      },
      {
        name: 'headers',
        label: 'Headers (JSON)',
        type: 'json',
        placeholder: '{"Authorization": "Bearer token"}',
        validation: z.string().optional()
      },
      {
        name: 'body',
        label: 'Request Body (JSON)',
        type: 'json',
        placeholder: '{"key": "value"}',
        validation: z.string().optional()
      }
    ],
    defaultConfig: { url: '', method: 'GET', headers: '{}', body: '{}' }
  },
  {
    type: 'email-action',
    category: 'action',
    label: 'Send Email',
    description: 'Send email notification',
    icon: '📧',
    color: '#3b82f6',
    inputs: 1,
    outputs: 1,
    fields: [
      {
        name: 'to',
        label: 'To',
        type: 'text',
        placeholder: 'recipient@example.com',
        required: true,
        validation: z.string().email('Must be a valid email')
      },
      {
        name: 'subject',
        label: 'Subject',
        type: 'text',
        placeholder: 'Email subject',
        required: true,
        validation: z.string().min(1, 'Subject is required')
      },
      {
        name: 'body',
        label: 'Body',
        type: 'textarea',
        placeholder: 'Email content...',
        required: true,
        validation: z.string().min(1, 'Body is required')
      }
    ],
    defaultConfig: { to: '', subject: '', body: '' }
  },
  {
    type: 'sms-action',
    category: 'action',
    label: 'Send SMS',
    description: 'Send SMS message',
    icon: '💬',
    color: '#3b82f6',
    inputs: 1,
    outputs: 1,
    fields: [
      {
        name: 'phoneNumber',
        label: 'Phone Number',
        type: 'text',
        placeholder: '+1234567890',
        required: true,
        validation: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Must be a valid phone number')
      },
      {
        name: 'message',
        label: 'Message',
        type: 'textarea',
        placeholder: 'SMS content...',
        required: true,
        validation: z.string().min(1, 'Message is required').max(160, 'Max 160 characters')
      }
    ],
    defaultConfig: { phoneNumber: '', message: '' }
  },

  // LOGIC
  {
    type: 'condition',
    category: 'logic',
    label: 'Condition',
    description: 'Branch based on condition',
    icon: '❓',
    color: '#f59e0b',
    inputs: 1,
    outputs: 2,
    fields: [
      {
        name: 'condition',
        label: 'Condition',
        type: 'text',
        placeholder: 'e.g., value > 100',
        required: true,
        validation: z.string().min(1, 'Condition is required')
      },
      {
        name: 'leftValue',
        label: 'Left Value',
        type: 'text',
        placeholder: 'Variable or value',
        required: true,
        validation: z.string().min(1, 'Required')
      },
      {
        name: 'operator',
        label: 'Operator',
        type: 'select',
        required: true,
        options: [
          { label: 'Equals (==)', value: '==' },
          { label: 'Not Equals (!=)', value: '!=' },
          { label: 'Greater Than (>)', value: '>' },
          { label: 'Less Than (<)', value: '<' },
          { label: 'Contains', value: 'contains' }
        ],
        validation: z.enum(['==', '!=', '>', '<', 'contains'])
      },
      {
        name: 'rightValue',
        label: 'Right Value',
        type: 'text',
        placeholder: 'Compare value',
        required: true,
        validation: z.string().min(1, 'Required')
      }
    ],
    defaultConfig: { condition: '', leftValue: '', operator: '==', rightValue: '' }
  },
  {
    type: 'transform',
    category: 'logic',
    label: 'Transform Data',
    description: 'Transform or map data',
    icon: '🔄',
    color: '#f59e0b',
    inputs: 1,
    outputs: 1,
    fields: [
      {
        name: 'transformName',
        label: 'Transform Name',
        type: 'text',
        placeholder: 'e.g., Format Response',
        required: true,
        validation: z.string().min(1, 'Name is required')
      },
      {
        name: 'expression',
        label: 'Transform Expression',
        type: 'textarea',
        placeholder: 'e.g., JSON.stringify(input)',
        required: true,
        validation: z.string().min(1, 'Expression is required')
      }
    ],
    defaultConfig: { transformName: '', expression: '' }
  },
  {
    type: 'delay',
    category: 'logic',
    label: 'Delay',
    description: 'Wait for specified time',
    icon: '⏱️',
    color: '#f59e0b',
    inputs: 1,
    outputs: 1,
    fields: [
      {
        name: 'duration',
        label: 'Duration (seconds)',
        type: 'number',
        placeholder: '5',
        required: true,
        validation: z.number().min(1, 'Must be at least 1 second')
      },
      {
        name: 'unit',
        label: 'Time Unit',
        type: 'select',
        required: true,
        options: [
          { label: 'Seconds', value: 'seconds' },
          { label: 'Minutes', value: 'minutes' },
          { label: 'Hours', value: 'hours' }
        ],
        validation: z.enum(['seconds', 'minutes', 'hours'])
      }
    ],
    defaultConfig: { duration: 5, unit: 'seconds' }
  }
]

export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return nodeDefinitions.find(def => def.type === type)
}

export function getNodesByCategory(category: string): NodeDefinition[] {
  return nodeDefinitions.filter(def => def.category === category)
}
