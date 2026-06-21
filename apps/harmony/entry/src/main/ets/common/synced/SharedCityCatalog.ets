// Synced from packages/types/src/index.ts.
// Harmony must consume this one-way synced artifact instead of redefining city
// constants inside page or model files.

export interface SharedCityOption {
  code: string
  name: string
}

export const SHARED_CITY_OPTIONS: SharedCityOption[] = [
  { code: 'SHANGHAI', name: '上海' },
  { code: 'BEIJING', name: '北京' },
  { code: 'GUANGZHOU', name: '广州' },
  { code: 'SHENZHEN', name: '深圳' },
  { code: 'HANGZHOU', name: '杭州' },
  { code: 'CHENGDU', name: '成都' }
]

export const SHARED_CITY_LABELS: Record<string, string> = {
  SHANGHAI: '上海',
  BEIJING: '北京',
  GUANGZHOU: '广州',
  SHENZHEN: '深圳',
  HANGZHOU: '杭州',
  CHENGDU: '成都'
}

export function resolveSharedCityLabel(cityName?: string | null, cityCode?: string | null): string {
  if (typeof cityCode === 'string' && cityCode.trim().length > 0) {
    const normalizedCode = cityCode.trim().toUpperCase()
    if (SHARED_CITY_LABELS[normalizedCode]) {
      return SHARED_CITY_LABELS[normalizedCode]
    }
    return normalizedCode
  }

  if (typeof cityName === 'string' && cityName.trim().length > 0) {
    return cityName.trim()
  }

  return ''
}
