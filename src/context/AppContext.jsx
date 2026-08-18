import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateId } from '../utils/dateHelpers';

const AppContext = createContext(null);

let toastCounter = 0;
const TOAST_DURATION = 3000;

export function AppProvider({ children }) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [providers, setProviders] = useState([]);
  const [entries, setEntries] = useState([]);
  const [monthlyPayments, setMonthlyPayments] = useState({});
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // ── Toasts ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_DURATION);
  }, []);

  // ── Fetch Initial Data ─────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        const [provRes, entRes, payRes] = await Promise.all([
          supabase.from('providers').select('*').order('created_at', { ascending: true }),
          supabase.from('entries').select('*').order('date', { ascending: false }),
          supabase.from('monthly_payments').select('*')
        ]);

        if (provRes.error) throw provRes.error;
        if (entRes.error) throw entRes.error;
        if (payRes.error) throw payRes.error;

        // Map Providers
        const mappedProviders = provRes.data.map(p => ({
          id: p.id,
          name: p.name,
          contact: p.contact || '',
          ratePerLitre: Number(p.rate_per_litre),
          defaultQuantity: Number(p.default_quantity) || 0,
          address: p.address || '',
          isActive: p.is_active,
          isCurrent: !!p.is_current,
          createdAt: p.created_at
        }));
        setProviders(mappedProviders);

        // Map Entries
        const mappedEntries = entRes.data.map(e => ({
          id: e.id,
          date: e.date,
          providerId: e.provider_id,
          milk: {
            morning: Number(e.milk_morning),
            evening: Number(e.milk_evening),
            ratePerLitre: Number(e.milk_rate),
            totalAmount: Number(e.milk_total)
          },
          newspaper: {
            taken: e.newspaper_taken,
            name: '', // Removed from DB schema to simplify
            rate: Number(e.newspaper_rate)
          },
          totalAmount: Number(e.total_amount),
          paymentMethod: e.payment_method,
          notes: e.notes || '',
          createdAt: e.created_at,
          updatedAt: e.updated_at
        }));
        setEntries(mappedEntries);

        // Map Payments to dict
        const paymentsDict = {};
        payRes.data.forEach(p => {
          paymentsDict[`${p.provider_id}_${p.year}_${p.month}`] = {
            status: p.status,
            method: p.method
          };
        });
        setMonthlyPayments(paymentsDict);

      } catch (error) {
        console.error('Error fetching from Supabase:', error);
        showToast('Error loading data from server', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [showToast]);

  // ── Provider CRUD ──────────────────────────────────────────────────────────
  const addProvider = useCallback(async (providerData) => {
    const newId = generateId(); // We can still generate UUID client-side for immediate UI update
    const dbPayload = {
      id: newId,
      name: providerData.name || '',
      contact: providerData.contact || '',
      rate_per_litre: parseFloat(providerData.ratePerLitre) || 0,
      default_quantity: parseFloat(providerData.defaultQuantity) || 0,
      address: providerData.address || '',
      is_active: providerData.isActive !== undefined ? providerData.isActive : true,
    };

    // Optimistic UI update
    const uiPayload = {
      id: dbPayload.id,
      name: dbPayload.name,
      contact: dbPayload.contact,
      ratePerLitre: dbPayload.rate_per_litre,
      defaultQuantity: dbPayload.default_quantity,
      address: dbPayload.address,
      isActive: dbPayload.is_active,
      createdAt: new Date().toISOString()
    };
    setProviders(prev => [...prev, uiPayload]);

    const { error } = await supabase.from('providers').insert([dbPayload]);
    if (error) {
      console.error(error);
      showToast('Error saving provider', 'error');
      // Ideally rollback here in a prod app
    }
    return uiPayload;
  }, [showToast]);

  const updateProvider = useCallback(async (id, updates) => {
    setProviders(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));

    const dbPayload = {};
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.contact !== undefined) dbPayload.contact = updates.contact;
    if (updates.ratePerLitre !== undefined) dbPayload.rate_per_litre = parseFloat(updates.ratePerLitre) || 0;
    if (updates.defaultQuantity !== undefined) dbPayload.default_quantity = parseFloat(updates.defaultQuantity) || 0;
    if (updates.address !== undefined) dbPayload.address = updates.address;
    if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive;

    if (Object.keys(dbPayload).length > 0) {
      const { error } = await supabase.from('providers').update(dbPayload).eq('id', id);
      if (error) showToast('Error updating provider', 'error');
    }
  }, [showToast]);

  const deleteProvider = useCallback(async (id) => {
    setProviders(prev => prev.filter(p => p.id !== id));
    setEntries(prev => prev.filter(e => e.providerId !== id));

    const { error } = await supabase.from('providers').delete().eq('id', id);
    if (error) showToast('Error deleting provider', 'error');
  }, [showToast]);

  const getProvider = useCallback((id) => providers.find(p => p.id === id) || null, [providers]);

  // ── Current Provider (DB-backed, syncs across devices) ─────────────────────
  const currentProvider = providers.find(p => p.isCurrent) || null;
  const currentProviderId = currentProvider?.id || '';

  const setCurrentProvider = useCallback(async (id) => {
    // Optimistic UI: set all to false, then target to true
    setProviders(prev => prev.map(p => ({
      ...p,
      isCurrent: p.id === id
    })));

    // DB: first unset all current, then set the chosen one
    const { error: resetError } = await supabase
      .from('providers')
      .update({ is_current: false })
      .eq('is_current', true); // only reset ones that are currently true

    if (resetError) {
      console.error('Error resetting current provider:', resetError);
    }

    if (id) {
      const { error } = await supabase
        .from('providers')
        .update({ is_current: true })
        .eq('id', id);
      if (error) {
        console.error('Error setting current provider:', error);
        showToast('Error setting delivering provider', 'error');
      }
    }
  }, [showToast]);

  // ── Entry CRUD ─────────────────────────────────────────────────────────────
  const _formatEntryForDB = (entryData, id) => {
    const morning = parseFloat(entryData.milk?.morning) || 0;
    const evening = parseFloat(entryData.milk?.evening) || 0;
    const rate = parseFloat(entryData.milk?.ratePerLitre) || 0;
    const milkTotalAmount = parseFloat(((morning + evening) * rate).toFixed(2));
    const newspaperTaken = !!entryData.newspaper?.taken;
    const newspaperRate = newspaperTaken ? parseFloat(entryData.newspaper?.rate) || 0 : 0;
    const totalAmount = parseFloat((milkTotalAmount + newspaperRate).toFixed(2));

    return {
      id: id || generateId(),
      date: entryData.date,
      provider_id: entryData.providerId,
      milk_morning: morning,
      milk_evening: evening,
      milk_rate: rate,
      milk_total: milkTotalAmount,
      newspaper_taken: newspaperTaken,
      newspaper_rate: newspaperRate,
      total_amount: totalAmount,
      payment_method: entryData.paymentMethod || 'Pending',
      notes: entryData.notes || ''
    };
  };

  const _formatEntryForUI = (dbPayload) => ({
    id: dbPayload.id,
    date: dbPayload.date,
    providerId: dbPayload.provider_id,
    milk: {
      morning: dbPayload.milk_morning,
      evening: dbPayload.milk_evening,
      ratePerLitre: dbPayload.milk_rate,
      totalAmount: dbPayload.milk_total
    },
    newspaper: {
      taken: dbPayload.newspaper_taken,
      rate: dbPayload.newspaper_rate
    },
    totalAmount: dbPayload.total_amount,
    paymentMethod: dbPayload.payment_method,
    notes: dbPayload.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const addEntry = useCallback(async (entryData) => {
    const dbPayload = _formatEntryForDB(entryData);
    const uiPayload = _formatEntryForUI(dbPayload);
    setEntries(prev => [...prev, uiPayload]);

    const { error } = await supabase.from('entries').insert([dbPayload]);
    if (error) showToast('Error saving entry', 'error');
    return uiPayload;
  }, [showToast]);

  const updateEntry = useCallback(async (id, updates) => {
    // We fetch the current entry to merge updates accurately for DB
    setEntries(prev => {
      const existing = prev.find(e => e.id === id);
      if (!existing) return prev;
      
      const mergedUI = { ...existing, ...updates };
      if (updates.milk) mergedUI.milk = { ...existing.milk, ...updates.milk };
      if (updates.newspaper) mergedUI.newspaper = { ...existing.newspaper, ...updates.newspaper };
      
      const uiPayload = _formatEntryForUI(_formatEntryForDB(mergedUI, id));
      uiPayload.createdAt = existing.createdAt;

      // Async DB call
      supabase.from('entries').update({
        milk_morning: uiPayload.milk.morning,
        milk_evening: uiPayload.milk.evening,
        milk_rate: uiPayload.milk.ratePerLitre,
        milk_total: uiPayload.milk.totalAmount,
        newspaper_taken: uiPayload.newspaper.taken,
        newspaper_rate: uiPayload.newspaper.rate,
        total_amount: uiPayload.totalAmount,
        payment_method: uiPayload.paymentMethod,
        notes: uiPayload.notes,
        updated_at: new Date().toISOString()
      }).eq('id', id).then(({error}) => {
        if(error) showToast('Error updating entry', 'error');
      });

      return prev.map(e => e.id === id ? uiPayload : e);
    });
  }, [showToast]);

  const deleteEntry = useCallback(async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) showToast('Error deleting entry', 'error');
  }, [showToast]);

  const saveBulkEntries = useCallback(async (newEntriesData) => {
    // Separate into inserts and updates
    setEntries(prev => {
      let updatedUI = [...prev];
      const dbUpserts = [];

      newEntriesData.forEach(entryData => {
        const dbPayload = _formatEntryForDB(entryData);
        const existingIndex = updatedUI.findIndex(e => e.date === dbPayload.date && e.providerId === dbPayload.provider_id);
        
        if (existingIndex !== -1) {
          dbPayload.id = updatedUI[existingIndex].id;
          const uiPayload = _formatEntryForUI(dbPayload);
          uiPayload.createdAt = updatedUI[existingIndex].createdAt;
          updatedUI[existingIndex] = uiPayload;
        } else {
          updatedUI.push(_formatEntryForUI(dbPayload));
        }
        dbUpserts.push(dbPayload);
      });

      // Async upsert to DB
      supabase.from('entries').upsert(dbUpserts, { onConflict: 'id' }).then(({error}) => {
        if (error) showToast('Error saving bulk entries', 'error');
      });

      return updatedUI;
    });
  }, [showToast]);

  const getEntry = useCallback((id) => entries.find(e => e.id === id) || null, [entries]);
  const getEntriesByMonth = useCallback((year, month) => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return entries.filter(e => e.date && e.date.startsWith(prefix));
  }, [entries]);
  const getEntryByDate = useCallback((dateStr) => entries.find(e => e.date === dateStr) || null, [entries]);

  // ── Monthly Payments ───────────────────────────────────────────────────────
  const updateMonthlyPayment = useCallback(async (providerId, year, month, paymentData) => {
    const key = `${providerId}_${year}_${month}`;
    setMonthlyPayments(prev => ({ ...prev, [key]: paymentData }));

    const { error } = await supabase.from('monthly_payments').upsert({
      provider_id: providerId,
      year,
      month,
      status: paymentData.status,
      method: paymentData.method
    }, { onConflict: 'provider_id,year,month' });

    if (error) {
      console.error(error);
      showToast('Error saving payment status', 'error');
    }
  }, [showToast]);

  // ── Context value ──────────────────────────────────────────────────────────
  const value = {
    loading,
    providers, addProvider, updateProvider, deleteProvider, getProvider,
    currentProviderId, currentProvider, setCurrentProvider,
    entries, addEntry, updateEntry, deleteEntry, saveBulkEntries, getEntry, getEntriesByMonth, getEntryByDate,
    monthlyPayments, updateMonthlyPayment,
    toasts, showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an <AppProvider>');
  return ctx;
}

export default AppContext;
