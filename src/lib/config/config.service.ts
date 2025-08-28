export type AppEnvironment = 'development' | 'test' | 'production' | 'unknown'

class ConfigService {
  getEnvironment(): AppEnvironment {
    const env = (process.env.NODE_ENV || 'development').toLowerCase()
    if (env === 'development' || env === 'production' || env === 'test') return env as AppEnvironment
    return 'unknown'
  }

  isProduction(): boolean {
    return this.getEnvironment() === 'production'
  }
}

export const configService = new ConfigService()

