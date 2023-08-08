/**
 * These are partial types
 */

export interface LeanClient {
  sendRequest: (method: string, params: any) => Promise<any>
}

export interface LeanClientProvider {
  getActiveClient: () => LeanClient
}

export interface LeanExports {
  clientProvider: LeanClientProvider
}

