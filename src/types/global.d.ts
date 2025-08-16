// Global type declarations

declare global {
  var onboardingDataStore: Map<string, { [stepId: string]: any }> | undefined
  
  namespace NodeJS {
    interface Global {
      onboardingDataStore?: Map<string, { [stepId: string]: any }>
    }
  }
}

export {}