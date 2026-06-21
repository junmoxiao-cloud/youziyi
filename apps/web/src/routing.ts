import { normalizeTrackedMetrics } from '@youziyi/types';

export interface RouteGuardProfile {
  trackedMetrics?: string[] | null;
  familyId?: string | null;
}

export function hasCompletedOnboarding(profile: RouteGuardProfile | null | undefined): boolean {
  return normalizeTrackedMetrics(profile?.trackedMetrics).length > 0;
}

export function hasJoinedFamily(profile: RouteGuardProfile | null | undefined): boolean {
  return typeof profile?.familyId === 'string' && profile.familyId.trim().length > 0;
}

export function resolveAuthenticatedLandingPath(profile: RouteGuardProfile | null | undefined): '/onboarding' | '/family/join' | '/role-select' {
  if (!hasCompletedOnboarding(profile)) {
    return '/onboarding';
  }

  if (!hasJoinedFamily(profile)) {
    return '/family/join';
  }

  return '/role-select';
}
