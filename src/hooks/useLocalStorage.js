import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that persists state in localStorage.
 *
 * @param {string} key          - localStorage key
 * @param {*}      initialValue - Fallback value when key doesn't exist or data is corrupted
 * @returns {[*, Function]}     - [storedValue, setValue]
 */
export function useLocalStorage(key, initialValue) {
  // Lazy initializer — runs only on first render
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      return JSON.parse(item);
    } catch (error) {
      // Corrupted data or JSON parse failure — fall back to initial value
      console.warn(
        `useLocalStorage: failed to parse key "${key}", resetting to initial value.`,
        error
      );
      // Remove the corrupted entry so it doesn't keep failing
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore removal errors (e.g. storage unavailable)
      }
      return initialValue;
    }
  });

  // Sync to localStorage whenever storedValue changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(
        `useLocalStorage: failed to save key "${key}" to localStorage.`,
        error
      );
    }
  }, [key, storedValue]);

  // Stable setter that mirrors useState's API (value or updater function)
  const setValue = useCallback((value) => {
    setStoredValue((prev) => {
      const nextValue = typeof value === 'function' ? value(prev) : value;
      return nextValue;
    });
  }, []);

  return [storedValue, setValue];
}
