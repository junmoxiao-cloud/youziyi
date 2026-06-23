import { normalizeTrackedMetrics } from './youziyi-types';

export interface RouteGuardProfile {
  trackedMetrics?: string[] | null;
  familyId?: string | null;
}

export function hasCompletedOnboarding(profile: RouteGuardProfile | null | undefined): boolean {
  return normalizeTrackedMetrics(profile && profile.trackedMetrics).length > 0;
}

export function hasJoinedFamily(profile: RouteGuardProfile | null | undefined): boolean {
  return Boolean(
    profile && typeof profile.familyId === 'string' && profile.familyId.trim().length > 0
  );
}

export function resolveAuthenticatedLandingPath(
  profile: RouteGuardProfile | null | undefined
): '/pages/onboarding/onboarding' | '/pages/family-join/family-join' | '/pages/role-select/role-select' {
  if (!hasCompletedOnboarding(profile)) {
    return '/pages/onboarding/onboarding';
  }

  if (!hasJoinedFamily(profile)) {
    return '/pages/family-join/family-join';
  }

  return '/pages/role-select/role-select';
}
