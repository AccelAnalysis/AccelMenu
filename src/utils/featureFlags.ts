export type FeatureFlagKey = 'newEditor' | 'multiLocationRoutes';

export interface FeatureFlags {
  newEditor: boolean;
  multiLocationRoutes: boolean;
  primaryLocationSlug?: string;
}

const STORAGE_KEY = 'accelmenu:featureFlags';
const DEFAULT_FLAGS: FeatureFlags = {
  newEditor: false,
  multiLocationRoutes: true,
  primaryLocationSlug: undefined,
};

function safeParse(value: string | null): Partial<FeatureFlags> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function getEnvBoolean(name: string, fallback: boolean): boolean {
  try {
    const envValue =
      typeof import.meta !== 'undefined'
        ? (import.meta as any).env?.[name]
        : typeof process !== 'undefined'
          ? (process.env as Record<string, string | undefined>)[name]
          : undefined;
    if (typeof envValue === 'boolean') return envValue;
    if (typeof envValue === 'string') return ['1', 'true', 'yes', 'on'].includes(envValue.toLowerCase());
  } catch {
    // ignore
  }
  return fallback;
}

function getEnvString(name: string): string | undefined {
  try {
    const envValue =
      typeof import.meta !== 'undefined'
        ? (import.meta as any).env?.[name]
        : typeof process !== 'undefined'
          ? (process.env as Record<string, string | undefined>)[name]
          : undefined;
    return envValue ?? undefined;
  } catch {
    return undefined;
  }
}

function getLocalOverrides(): Partial<FeatureFlags> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

function computeFlags(): FeatureFlags {
  const overrides = getLocalOverrides();

  return {
    newEditor: overrides.newEditor ?? getEnvBoolean('VITE_FEATURE_NEW_EDITOR', DEFAULT_FLAGS.newEditor),
    multiLocationRoutes:
      overrides.multiLocationRoutes ?? getEnvBoolean('VITE_FEATURE_MULTI_LOCATION', DEFAULT_FLAGS.multiLocationRoutes),
    primaryLocationSlug: overrides.primaryLocationSlug ?? getEnvString('VITE_PRIMARY_LOCATION_SLUG') ?? DEFAULT_FLAGS.primaryLocationSlug,
  };
}

let cachedFlags: FeatureFlags | null = null;

export function getFeatureFlags(): FeatureFlags {
  if (!cachedFlags) {
    cachedFlags = computeFlags();
  }
  return cachedFlags;
}

export function refreshFeatureFlags(): FeatureFlags {
  cachedFlags = computeFlags();
  return cachedFlags;
}

export function isNewEditorEnabled(): boolean {
  return getFeatureFlags().newEditor;
}

export function isMultiLocationEnabled(): boolean {
  return getFeatureFlags().multiLocationRoutes;
}

export function getPrimaryLocationSlug(): string | undefined {
  return getFeatureFlags().primaryLocationSlug;
}
