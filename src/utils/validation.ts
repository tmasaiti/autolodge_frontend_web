import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'

// Initialize Ajv with formats
const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

// User Profile Schema
export interface UserProfileData {
  first_name: string
  last_name: string
  date_of_birth: string
  nationality: string
  address: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  preferences: {
    language: string
    currency: string
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
}

const userProfileSchema: JSONSchemaType<UserProfileData> = {
  type: 'object',
  properties: {
    first_name: { type: 'string', minLength: 1, maxLength: 50 },
    last_name: { type: 'string', minLength: 1, maxLength: 50 },
    date_of_birth: { type: 'string', format: 'date' },
    nationality: { type: 'string', minLength: 2, maxLength: 3 },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string', minLength: 1 },
        city: { type: 'string', minLength: 1 },
        state: { type: 'string', minLength: 1 },
        postal_code: { type: 'string', minLength: 1 },
        country: { type: 'string', minLength: 2, maxLength: 3 },
      },
      required: ['street', 'city', 'state', 'postal_code', 'country'],
      additionalProperties: false,
    },
    preferences: {
      type: 'object',
      properties: {
        language: { type: 'string', minLength: 2, maxLength: 5 },
        currency: { type: 'string', minLength: 3, maxLength: 3 },
        notifications: {
          type: 'object',
          properties: {
            email: { type: 'boolean' },
            sms: { type: 'boolean' },
            push: { type: 'boolean' },
          },
          required: ['email', 'sms', 'push'],
          additionalProperties: false,
        },
      },
      required: ['language', 'currency', 'notifications'],
      additionalProperties: false,
    },
  },
  required: ['first_name', 'last_name', 'date_of_birth', 'nationality', 'address', 'preferences'],
  additionalProperties: false,
}

// Vehicle Specifications Schema
export interface VehicleSpecificationsData {
  engine: {
    type: string
    displacement: number
    fuel_type: string
  }
  transmission: string
  seats: number
  doors: number
  features: string[]
  safety_features: string[]
  entertainment: string[]
}

const vehicleSpecificationsSchema: JSONSchemaType<VehicleSpecificationsData> = {
  type: 'object',
  properties: {
    engine: {
      type: 'object',
      properties: {
        type: { type: 'string', minLength: 1 },
        displacement: { type: 'number', minimum: 0 },
        fuel_type: { type: 'string', enum: ['petrol', 'diesel', 'electric', 'hybrid'] },
      },
      required: ['type', 'displacement', 'fuel_type'],
      additionalProperties: false,
    },
    transmission: { type: 'string', enum: ['manual', 'automatic', 'cvt'] },
    seats: { type: 'number', minimum: 1, maximum: 50 },
    doors: { type: 'number', minimum: 2, maximum: 6 },
    features: { type: 'array', items: { type: 'string' } },
    safety_features: { type: 'array', items: { type: 'string' } },
    entertainment: { type: 'array', items: { type: 'string' } },
  },
  required: ['engine', 'transmission', 'seats', 'doors', 'features', 'safety_features', 'entertainment'],
  additionalProperties: false,
}

// Compile validators
export const validateUserProfile = ajv.compile(userProfileSchema)
export const validateVehicleSpecifications = ajv.compile(vehicleSpecificationsSchema)

// Generic validation function
export function validateData<T>(data: unknown, validator: any): { valid: boolean; errors?: string[] } {
  const valid = validator(data)
  if (!valid && validator.errors) {
    const errors = validator.errors.map((error: any) => `${error.instancePath} ${error.message}`)
    return { valid: false, errors }
  }
  return { valid: true }
}

// JSON data handler utility
export class JSONDataHandler<T> {
  private validator: any

  constructor(validator: any) {
    this.validator = validator
  }

  validate(data: unknown): T {
    const result = validateData(data, this.validator)
    if (!result.valid) {
      throw new Error(`Validation failed: ${result.errors?.join(', ')}`)
    }
    return data as T
  }

  transform(data: T): any {
    // Override in subclasses for specific transformations
    return data
  }

  serialize(data: any): T {
    // Override in subclasses for specific serialization
    return data as T
  }
}