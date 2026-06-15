export enum ApiMode {
  REMOTE = 'remote',
  MOCK = 'mock'
}

export enum AppEnvironment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production'
}

export interface VerificationConfig {
  requestMode: ApiMode
  allowMockFallback: boolean
  enableUniversalCode: boolean
  universalCode: string
  remoteBindingPath: string
}

export interface AppConfig {
  environment: AppEnvironment
  apiBaseUrl: string
  apiMode: ApiMode
  verification: VerificationConfig
}

const CLOUD_API_BASE_URL: string = 'https://api.youziyi.com'
const LOCAL_API_BASE_URL: string = 'http://localhost:3001'
const DEFAULT_APP_ENVIRONMENT: AppEnvironment = AppEnvironment.PRODUCTION

export function isMockMode(mode: ApiMode): boolean {
  return mode === ApiMode.MOCK
}

export function isDevelopmentEnvironment(): boolean {
  return APP_CONFIG.environment === AppEnvironment.DEVELOPMENT
}

export function isProductionEnvironment(): boolean {
  return APP_CONFIG.environment === AppEnvironment.PRODUCTION
}

export function getVerificationRequestMode(): ApiMode {
  return isDevelopmentEnvironment() ? APP_CONFIG.verification.requestMode : ApiMode.REMOTE
}

export function isUniversalCodeEnabled(): boolean {
  return isDevelopmentEnvironment() && APP_CONFIG.verification.enableUniversalCode
}

export function isMockFallbackEnabled(): boolean {
  return isDevelopmentEnvironment() && APP_CONFIG.verification.allowMockFallback
}

function resolveDefaultApiBaseUrl(environment: AppEnvironment): string {
  return environment === AppEnvironment.DEVELOPMENT ? LOCAL_API_BASE_URL : CLOUD_API_BASE_URL
}

function resolveDefaultVerificationConfig(environment: AppEnvironment): VerificationConfig {
  const allowDevelopmentFallback = environment === AppEnvironment.DEVELOPMENT

  return {
    requestMode: ApiMode.REMOTE,
    allowMockFallback: allowDevelopmentFallback,
    enableUniversalCode: allowDevelopmentFallback,
    universalCode: '123456',
    remoteBindingPath: '/api/health'
  }
}

export function resolveApiUrl(path: string): string {
  if (path.length === 0) {
    return APP_CONFIG.apiBaseUrl
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${APP_CONFIG.apiBaseUrl}${normalizedPath}`
}

export const APP_CONFIG: AppConfig = {
  environment: DEFAULT_APP_ENVIRONMENT,
  apiBaseUrl: resolveDefaultApiBaseUrl(DEFAULT_APP_ENVIRONMENT),
  apiMode: ApiMode.REMOTE,
  verification: resolveDefaultVerificationConfig(DEFAULT_APP_ENVIRONMENT)
}
