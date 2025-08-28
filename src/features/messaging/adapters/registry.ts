/** Minimal no-op registry to avoid hard build failures in environments
 * where messaging providers are not configured. This satisfies the
 * MessagingService interface without bundling provider SDKs.
 */
export class AdapterRegistry {
  private initialized = false
  async initialize(): Promise<void> { this.initialized = true }
  getAdapter(_name: string): any | null { return null }
  getAdapterForChannel(_channel: string, _preferredProvider?: string): any | null { return null }
  getAllAdapters(): Map<string, any> { return new Map() }
  getAdaptersForChannel(_channel: string): any[] { return [] }
  isChannelSupported(_channel: string): boolean { return false }
  getStatus(): { initialized: boolean; adapterCount: number; adapters: any[] } {
    return { initialized: this.initialized, adapterCount: 0, adapters: [] }
  }
  async reload(): Promise<void> { this.initialized = false; await this.initialize() }
  async healthCheck(): Promise<Record<string, boolean>> { return {} }
}

export const adapterRegistry = new AdapterRegistry()
