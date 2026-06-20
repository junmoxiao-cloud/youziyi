import { UserProfileResponse, UserRole } from './ApiModels'

class AppSessionStore {
  private userIdValue: string = ''
  private userNameValue: string = ''
  private userRoleValue: UserRole = 'elder'
  private profileValue: UserProfileResponse | null = null

  setAuth(userId: string, userName: string, role: UserRole): void {
    this.userIdValue = userId
    this.userNameValue = userName
    this.userRoleValue = role
  }

  clear(): void {
    this.userIdValue = ''
    this.userNameValue = ''
    this.userRoleValue = 'elder'
    this.profileValue = null
  }

  setProfile(profile: UserProfileResponse | null): void {
    this.profileValue = profile
    if (profile) {
      this.userIdValue = profile.userId
      this.userNameValue = profile.name
      this.userRoleValue = profile.role
    }
  }

  getUserId(): string {
    return this.userIdValue
  }

  getUserName(): string {
    return this.userNameValue
  }

  getUserRole(): UserRole {
    return this.userRoleValue
  }

  getProfile(): UserProfileResponse | null {
    return this.profileValue
  }
}

export const appSession: AppSessionStore = new AppSessionStore()

export function isOnboardingCompleted(profile: UserProfileResponse | null): boolean {
  if (!profile) {
    return false
  }

  const hasCity = Boolean((profile.cityCode && profile.cityCode.trim().length > 0) || (profile.city && profile.city.trim().length > 0))
  const hasTrackedMetrics = Array.isArray(profile.trackedMetrics) && profile.trackedMetrics.length > 0
  return hasCity && hasTrackedMetrics
}

export function hasJoinedFamily(profile: UserProfileResponse | null): boolean {
  return Boolean(profile?.familyId)
}

export function resolveAuthenticatedRoute(profile: UserProfileResponse | null): string {
  if (!isOnboardingCompleted(profile)) {
    return 'pages/Onboarding'
  }

  if (!hasJoinedFamily(profile)) {
    return 'pages/FamilyJoin'
  }

  return 'pages/Main'
}
