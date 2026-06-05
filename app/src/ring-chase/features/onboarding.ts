const ONBOARDING_KEY = 'ring-chase-onboarding-seen';
const VISIT_KEY = 'ring-chase-visit-count';

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {
    return true;
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function getVisitCount(): number {
  try {
    return Number(localStorage.getItem(VISIT_KEY) ?? 0);
  } catch {
    return 0;
  }
}

export function recordVisit(): void {
  try {
    const next = getVisitCount() + 1;
    localStorage.setItem(VISIT_KEY, String(next));
  } catch {
    /* ignore */
  }
}

export function isReturningPlayer(): boolean {
  return getVisitCount() > 0;
}
