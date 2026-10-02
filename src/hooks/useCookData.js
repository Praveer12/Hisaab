import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─── Cook localStorage keys (fallback when no supabase table exists) ───────
const LS_KEY = 'hisaab_cook_data';

function loadFromLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToLS(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

// data structure: { 'YYYY-MM': { salary: number, paid: boolean, paidDate: string|null, notes: string } }

export function useCookData() {
  const [cookData, setCookData] = useState(loadFromLS);
  const [loading, setLoading] = useState(false);

  const getMonthData = useCallback((year, month) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    return cookData[key] || { salary: 0, paid: false, paidDate: null, notes: '' };
  }, [cookData]);

  const updateMonthData = useCallback((year, month, updates) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    setCookData(prev => {
      const existing = prev[key] || { salary: 0, paid: false, paidDate: null, notes: '' };
      const updated = { ...existing, ...updates };
      const newData = { ...prev, [key]: updated };
      saveToLS(newData);
      return newData;
    });
  }, []);

  const markPaid = useCallback((year, month) => {
    const today = new Date().toISOString().split('T')[0];
    updateMonthData(year, month, { paid: true, paidDate: today });
  }, [updateMonthData]);

  const markUnpaid = useCallback((year, month) => {
    updateMonthData(year, month, { paid: false, paidDate: null });
  }, [updateMonthData]);

  return { cookData, loading, getMonthData, updateMonthData, markPaid, markUnpaid };
}
