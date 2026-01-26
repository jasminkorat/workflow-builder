import { describe, it, expect } from 'vitest'
import { validateFieldValue, validateNodeConfig, isConfigComplete } from '../utils/validation'
import { z } from 'zod'
import type { FieldSchema } from '../types'

describe('Validation Utils', () => {
  it('should validate text field', () => {
    const field: FieldSchema = {
      name: 'email',
      label: 'Email',
      type: 'text',
      required: true,
      validation: z.string().email()
    }

    const validResult = validateFieldValue(field, 'test@example.com')
    expect(validResult.valid).toBe(true)

    const invalidResult = validateFieldValue(field, 'invalid-email')
    expect(invalidResult.valid).toBe(false)
    expect(invalidResult.error).toBeDefined()
  })

  it('should validate number field', () => {
    const field: FieldSchema = {
      name: 'duration',
      label: 'Duration',
      type: 'number',
      required: true,
      validation: z.number().min(1)
    }

    const validResult = validateFieldValue(field, 5)
    expect(validResult.valid).toBe(true)

    const invalidResult = validateFieldValue(field, 0)
    expect(invalidResult.valid).toBe(false)
  })

  it('should validate JSON field', () => {
    const field: FieldSchema = {
      name: 'headers',
      label: 'Headers',
      type: 'json',
      validation: z.string()
    }

    const validResult = validateFieldValue(field, '{"key": "value"}')
    expect(validResult.valid).toBe(true)

    const invalidResult = validateFieldValue(field, '{invalid json}')
    expect(invalidResult.valid).toBe(false)
  })

  it('should validate complete node config', () => {
    const fields: FieldSchema[] = [
      {
        name: 'to',
        label: 'To',
        type: 'text',
        required: true,
        validation: z.string().email()
      },
      {
        name: 'subject',
        label: 'Subject',
        type: 'text',
        required: true,
        validation: z.string().min(1)
      }
    ]

    const validConfig = {
      to: 'test@example.com',
      subject: 'Test Subject'
    }

    const result = validateNodeConfig(fields, validConfig)
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('should detect invalid node config', () => {
    const fields: FieldSchema[] = [
      {
        name: 'to',
        label: 'To',
        type: 'text',
        required: true,
        validation: z.string().email()
      },
      {
        name: 'subject',
        label: 'Subject',
        type: 'text',
        required: true,
        validation: z.string().min(1)
      }
    ]

    const invalidConfig = {
      to: 'invalid-email',
      subject: ''
    }

    const result = validateNodeConfig(fields, invalidConfig)
    expect(result.valid).toBe(false)
    expect(Object.keys(result.errors).length).toBeGreaterThan(0)
  })

  it('should check if config is complete', () => {
    const fields: FieldSchema[] = [
      {
        name: 'field1',
        label: 'Field 1',
        type: 'text',
        required: true
      },
      {
        name: 'field2',
        label: 'Field 2',
        type: 'text',
        required: false
      }
    ]

    expect(isConfigComplete(fields, { field1: 'value' })).toBe(true)
    expect(isConfigComplete(fields, { field1: '' })).toBe(false)
    expect(isConfigComplete(fields, {})).toBe(false)
  })
})
