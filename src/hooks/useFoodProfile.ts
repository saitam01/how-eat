import { useCallback, useState } from 'react';
import { loadFoodProfile, sanitizeFoodProfile, saveFoodProfile } from '../lib/food-profile';
import type { FoodProfileInput } from '../lib/types';

/** Owns the locally persisted planning preferences without wiring them into the current UI. */
export function useFoodProfile() {
  const [profile, setProfileState] = useState<FoodProfileInput>(loadFoodProfile);

  const setProfile = useCallback((next: FoodProfileInput | ((current: FoodProfileInput) => FoodProfileInput)) => {
    setProfileState((current) => {
      const resolved = typeof next === 'function' ? next(current) : next;
      const safeProfile = sanitizeFoodProfile(resolved);
      saveFoodProfile(safeProfile);
      return safeProfile;
    });
  }, []);

  const updateProfile = useCallback((changes: Partial<FoodProfileInput>) => {
    setProfile((current) => ({ ...current, ...changes }));
  }, [setProfile]);

  return { profile, setProfile, updateProfile };
}
