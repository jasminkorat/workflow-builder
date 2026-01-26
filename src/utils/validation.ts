import { z } from 'zod'
import type { FieldSchema } from '../types'

export function validateFieldValue(field: FieldSchema, value: any): { valid: boolean; error?: string } {
  if (!field.validation) {
    return { valid: true }
  }

  try {
    // Handle JSON fields
    if (field.type === 'json' && typeof value === 'string') {
      if (value.trim() === '' && !field.required) {
        return { valid: true }
      }
      try {
        JSON.parse(value)
      } catch {
        return { valid: false, error: 'Invalid JSON format' }
      }
    }

    // Validate with Zod
    field.validation.parse(value)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues && error.issues[0] ? error.issues[0].message : 'Validation failed'
      return { valid: false, error: firstError }
    }
    return { valid: false, error: 'Validation failed' }
  }
}

export function validateNodeConfig(
  fields: FieldSchema[],
  config: Record<string, any>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  fields.forEach(field => {
    const value = config[field.name]
    const result = validateFieldValue(field, value)
    if (!result.valid && result.error) {
      errors[field.name] = result.error
    }
  })

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

export function isConfigComplete(fields: FieldSchema[], config: Record<string, any>): boolean {
  return fields.every(field => {
    if (!field.required) return true
    const value = config[field.name]
    return value !== undefined && value !== null && value !== ''
  })
}
