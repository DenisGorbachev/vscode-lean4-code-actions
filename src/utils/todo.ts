import { nail } from './string'

export function todo<V>(value?: V, message = 'TODO'): V {
  if (value === undefined) { throw impl(message) }
  return value
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function impl(message = '') {
  return new ImplementationError(nail(message).trim())
}

export class ImplementationError extends Error {

}
