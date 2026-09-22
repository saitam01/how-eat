import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFoodProfile } from '@/hooks/useFoodProfile';
import {
  DEFAULT_FOOD_PROFILE,
  FOOD_PROFILE_SCHEMA_VERSION,
  FOOD_PROFILE_STORAGE_KEY,
  loadFoodProfile,
  sanitizeFoodProfile,
  saveFoodProfile,
} from '@/lib/food-profile';

describe('food profile persistence', () => {
  beforeEach(() => window.localStorage.clear());

  it('uses safe WMP defaults when no profile was persisted', () => {
    expect(loadFoodProfile()).toEqual(DEFAULT_FOOD_PROFILE);
    expect(DEFAULT_FOOD_PROFILE).toMatchObject({
      dietaryPattern: 'omnivore',
      maxFoodRepeatsPerWeek: 2,
      maxVarietyGroupRepeatsPerWeek: 7,
    });
  });

  it('round-trips a valid versioned profile', () => {
    const profile = {
      ...DEFAULT_FOOD_PROFILE,
      allergens: ['milk'] as const,
      strictIntolerances: ['lactose'] as const,
      excludedFoodIds: ['p01'],
      preferredFoodIds: ['f08'],
      dietaryPattern: 'vegetarian' as const,
      maxFoodRepeatsPerWeek: 1,
      maxVarietyGroupRepeatsPerWeek: 4,
    };

    saveFoodProfile(profile);

    expect(loadFoodProfile()).toEqual(profile);
    expect(JSON.parse(window.localStorage.getItem(FOOD_PROFILE_STORAGE_KEY) as string)).toEqual({
      version: FOOD_PROFILE_SCHEMA_VERSION,
      profile,
    });
  });

  it('falls back to defaults for malformed, stale, or arbitrary payload values', () => {
    for (const payload of [
      'not json',
      JSON.stringify({ version: FOOD_PROFILE_SCHEMA_VERSION, profile: { ...DEFAULT_FOOD_PROFILE, dietaryPattern: 'paleo' } }),
      JSON.stringify({ version: FOOD_PROFILE_SCHEMA_VERSION, profile: { ...DEFAULT_FOOD_PROFILE, allergens: ['unknown'] } }),
      JSON.stringify({ version: FOOD_PROFILE_SCHEMA_VERSION, profile: { ...DEFAULT_FOOD_PROFILE, excludedFoodIds: ['not-a-catalog-food'] } }),
      JSON.stringify({ version: FOOD_PROFILE_SCHEMA_VERSION, profile: { ...DEFAULT_FOOD_PROFILE, maxFoodRepeatsPerWeek: 99 } }),
      JSON.stringify({ version: FOOD_PROFILE_SCHEMA_VERSION, profile: { allergens: [] } }),
    ]) {
      window.localStorage.setItem(FOOD_PROFILE_STORAGE_KEY, payload);
      expect(loadFoodProfile()).toEqual(DEFAULT_FOOD_PROFILE);
    }
  });

  it('rejects payloads with missing or unsupported schema versions', () => {
    for (const payload of [
      { profile: DEFAULT_FOOD_PROFILE },
      { version: 0, profile: DEFAULT_FOOD_PROFILE },
      { version: 2, profile: DEFAULT_FOOD_PROFILE },
    ]) {
      window.localStorage.setItem(FOOD_PROFILE_STORAGE_KEY, JSON.stringify(payload));
      expect(loadFoodProfile()).toEqual(DEFAULT_FOOD_PROFILE);
    }
  });

  it('does not allow invalid hook updates to diverge state from storage', () => {
    const { result } = renderHook(() => useFoodProfile());

    act(() => {
      result.current.setProfile({ ...DEFAULT_FOOD_PROFILE, allergens: ['not-an-allergen'] } as unknown as typeof DEFAULT_FOOD_PROFILE);
    });

    expect(result.current.profile).toEqual(DEFAULT_FOOD_PROFILE);
    expect(loadFoodProfile()).toEqual(DEFAULT_FOOD_PROFILE);
    expect(JSON.parse(window.localStorage.getItem(FOOD_PROFILE_STORAGE_KEY) as string)).toEqual({
      version: FOOD_PROFILE_SCHEMA_VERSION,
      profile: DEFAULT_FOOD_PROFILE,
    });
  });

  it('does not throw when storage is unavailable', () => {
    const getItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(loadFoodProfile()).toEqual(DEFAULT_FOOD_PROFILE);
    getItem.mockRestore();

    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => saveFoodProfile(DEFAULT_FOOD_PROFILE)).not.toThrow();
  });

  it('rejects arrays and objects that do not match the complete profile contract', () => {
    expect(sanitizeFoodProfile([])).toEqual(DEFAULT_FOOD_PROFILE);
    expect(sanitizeFoodProfile({ ...DEFAULT_FOOD_PROFILE, preferredFoodIds: ['f08', 'f08'] })).toEqual(DEFAULT_FOOD_PROFILE);
  });
});
