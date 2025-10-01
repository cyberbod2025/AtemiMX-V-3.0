
import type { PerfilDocente } from '../types';

const PROFILE_KEY = 'perfilDocente';

export const saveProfile = (profile: PerfilDocente): void => {
  try {
    const profileString = JSON.stringify(profile);
    localStorage.setItem(PROFILE_KEY, profileString);
  } catch (error) {
    console.error("Error saving profile to localStorage", error);
  }
};

export const getProfile = (): PerfilDocente | null => {
  try {
    const profileString = localStorage.getItem(PROFILE_KEY);
    if (profileString) {
      return JSON.parse(profileString) as PerfilDocente;
    }
    return null;
  } catch (error) {
    console.error("Error reading profile from localStorage", error);
    return null;
  }
};

export const clearProfile = (): void => {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (error) {
    console.error("Error clearing profile from localStorage", error);
  }
};

// Generic storage functions for modules
export const saveData = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(`atemi:${key}`, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data for key ${key}`, error);
  }
};

export const loadData = <T,>(key: string): T | null => {
  try {
    const dataString = localStorage.getItem(`atemi:${key}`);
    return dataString ? JSON.parse(dataString) as T : null;
  } catch (error) {
    console.error(`Error loading data for key ${key}`, error);
    return null;
  }
};
