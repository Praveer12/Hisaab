import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateId } from '../utils/dateHelpers';

const AppContext = createContext(null);

// ─── Toast helpers ──────────────────────────────────────────────────────────

let toastCounter = 0;
const TOAST_DURATION = 3000; // auto-dismiss after 3 seconds

// ─── Provider Component ─────────────────────────────────────────────────────

export function AppProvider({ children }) {
  // ── Persisted state ────────────────────────────────────────────────────────
  const [providers, setProviders] = useLocalStorage('doodhbook_providers', []);
  const [entries, setEntries] = useLocalStorage('doodhbook_entries', []);
  const [monthlyPayments, setMonthlyPayments] = useLocalStorage('doodhbook_monthly_payments', {});

  // ── Toasts (ephemeral, not persisted) ──────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  // ── Provider CRUD ──────────────────────────────────────────────────────────

  const addProvider = useCallback(
    (providerData) => {
      const newProvider = {
        id: generateId(),
        name: providerData.name || '',
        contact: providerData.contact || '',
        ratePerLitre: parseFloat(providerData.ratePerLitre) || 0,
        address: providerData.address || '',
        isActive: providerData.isActive !== undefined ? providerData.isActive : true,
        createdAt: new Date().toISOString(),
      };
      setProviders((prev) => [...prev, newProvider]);
      return newProvider;
    },
    [setProviders]
  );

  const updateProvider = useCallback(
    (id, updates) => {
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    [setProviders]
  );

  const deleteProvider = useCallback(
    (id) => {
      setProviders((prev) => prev.filter((p) => p.id !== id));
      // Also remove all entries associated with this provider
      setEntries((prev) => prev.filter((e) => e.providerId !== id));
    },
    [setProviders, setEntries]
  );

  const getProvider = useCallback(
    (id) => providers.find((p) => p.id === id) || null,
    [providers]
  );

  // ── Entry CRUD ─────────────────────────────────────────────────────────────

  const addEntry = useCallback(
    (entryData) => {
      const morning = parseFloat(entryData.milk?.morning) || 0;
      const evening = parseFloat(entryData.milk?.evening) || 0;
      const rate = parseFloat(entryData.milk?.ratePerLitre) || 0;
      const milkTotalAmount = parseFloat(((morning + evening) * rate).toFixed(2));

      const newspaperTaken = !!entryData.newspaper?.taken;
      const newspaperRate = newspaperTaken
        ? parseFloat(entryData.newspaper?.rate) || 0
        : 0;

      const totalAmount = parseFloat((milkTotalAmount + newspaperRate).toFixed(2));

      const newEntry = {
        id: generateId(),
        date: entryData.date || '',
        providerId: entryData.providerId || '',
        milk: {
          morning,
          evening,
          ratePerLitre: rate,
          totalAmount: milkTotalAmount,
        },
        newspaper: {
          taken: newspaperTaken,
          name: entryData.newspaper?.name || '',
          rate: parseFloat(entryData.newspaper?.rate) || 0,
        },
        paymentMethod: entryData.paymentMethod || 'Pending',
        totalAmount,
        notes: entryData.notes || '',
        createdAt: new Date().toISOString(),
      };

      setEntries((prev) => [...prev, newEntry]);
      return newEntry;
    },
    [setEntries]
  );

  const updateEntry = useCallback(
    (id, updates) => {
      setEntries((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;

          const merged = { ...e, ...updates };

          // Recalculate milk total if milk fields were updated
          if (updates.milk) {
            const milk = { ...e.milk, ...updates.milk };
            const morning = parseFloat(milk.morning) || 0;
            const evening = parseFloat(milk.evening) || 0;
            const rate = parseFloat(milk.ratePerLitre) || 0;
            milk.totalAmount = parseFloat(((morning + evening) * rate).toFixed(2));
            merged.milk = milk;
          }

          // Recalculate total amount
          const milkAmt = parseFloat(merged.milk?.totalAmount) || 0;
          const paperAmt = merged.newspaper?.taken
            ? parseFloat(merged.newspaper?.rate) || 0
            : 0;
          merged.totalAmount = parseFloat((milkAmt + paperAmt).toFixed(2));

          return merged;
        })
      );
    },
    [setEntries]
  );

  const deleteEntry = useCallback(
    (id) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [setEntries]
  );

  const saveBulkEntries = useCallback(
    (newEntriesData) => {
      setEntries((prev) => {
        let updated = [...prev];
        newEntriesData.forEach((entryData) => {
          const morning = parseFloat(entryData.milk?.morning) || 0;
          const evening = parseFloat(entryData.milk?.evening) || 0;
          const rate = parseFloat(entryData.milk?.ratePerLitre) || 0;
          const milkTotalAmount = parseFloat(((morning + evening) * rate).toFixed(2));

          const newspaperTaken = !!entryData.newspaper?.taken;
          const newspaperRate = newspaperTaken
            ? parseFloat(entryData.newspaper?.rate) || 0
            : 0;

          const totalAmount = parseFloat((milkTotalAmount + newspaperRate).toFixed(2));

          const entryPayload = {
            date: entryData.date || '',
            providerId: entryData.providerId || '',
            milk: {
              morning,
              evening,
              ratePerLitre: rate,
              totalAmount: milkTotalAmount,
            },
            newspaper: {
              taken: newspaperTaken,
              name: entryData.newspaper?.name || '',
              rate: parseFloat(entryData.newspaper?.rate) || 0,
            },
            paymentMethod: entryData.paymentMethod || 'Pending',
            totalAmount,
            notes: entryData.notes || '',
            updatedAt: new Date().toISOString(),
          };

          // Find if there is an existing entry for this date and provider
          const existingIndex = updated.findIndex(
            (e) => e.date === entryPayload.date && e.providerId === entryPayload.providerId
          );

          if (existingIndex !== -1) {
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...entryPayload,
              id: updated[existingIndex].id,
              createdAt: updated[existingIndex].createdAt || new Date().toISOString(),
            };
          } else {
            updated.push({
              id: generateId(),
              createdAt: new Date().toISOString(),
              ...entryPayload,
            });
          }
        });
        return updated;
      });
    },
    [setEntries]
  );

  const getEntry = useCallback(
    (id) => entries.find((e) => e.id === id) || null,
    [entries]
  );

  const getEntriesByMonth = useCallback(
    (year, month) => {
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      return entries.filter((e) => e.date && e.date.startsWith(prefix));
    },
    [entries]
  );

  const getEntryByDate = useCallback(
    (dateStr) => entries.find((e) => e.date === dateStr) || null,
    [entries]
  );

  const updateMonthlyPayment = useCallback(
    (providerId, year, month, paymentData) => {
      const key = `${providerId}_${year}_${month}`;
      setMonthlyPayments((prev) => ({
        ...prev,
        [key]: paymentData, // e.g. { status: 'Paid', method: 'UPI' } or { status: 'Pending' }
      }));
    },
    [setMonthlyPayments]
  );

  // ── Context value ──────────────────────────────────────────────────────────

  const value = {
    // Providers
    providers,
    addProvider,
    updateProvider,
    deleteProvider,
    getProvider,

    // Entries
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    saveBulkEntries,
    getEntry,
    getEntriesByMonth,
    getEntryByDate,

    // Monthly Payments
    monthlyPayments,
    updateMonthlyPayment,

    // Toasts
    toasts,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Convenience hook to consume the App context.
 * Throws if used outside of <AppProvider>.
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an <AppProvider>');
  }
  return ctx;
}

export default AppContext;
