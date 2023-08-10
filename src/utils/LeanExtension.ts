/**
 * These are partial types
 */

export interface LeanClient {
  sendRequest: (method: string, params: unknown) => Promise<unknown>
}

export interface LeanClientProvider {
  getActiveClient: () => LeanClient
}

export interface LeanExports {
  clientProvider: LeanClientProvider
}

