// Role definitions matching cadesk365/permissions.py
export const HIGH_LEVEL_ROLES = [
  "Managing Partner",
  "Partner",
  "Functional Head",
  "Manager",
] as const;

export const LOW_LEVEL_ROLES = [
  "Senior Executive",
  "Article Assistant",
  "Trainee",
] as const;

export const SYSTEM_ROLES = [
  "Administrator",
  "System Manager",
] as const;

export type HighLevelRole = (typeof HIGH_LEVEL_ROLES)[number];
export type LowLevelRole = (typeof LOW_LEVEL_ROLES)[number];

export function isHighLevel(roles: string[]): boolean {
  return roles.some(
    (r) =>
      (HIGH_LEVEL_ROLES as readonly string[]).includes(r) ||
      (SYSTEM_ROLES as readonly string[]).includes(r)
  );
}

export function isLowLevel(roles: string[]): boolean {
  return roles.some((r) => (LOW_LEVEL_ROLES as readonly string[]).includes(r));
}
