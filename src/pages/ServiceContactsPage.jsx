import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Phone, MessageCircle, Plus, Search, Trash2, Edit3, X,
  UserPlus, Share2, ChevronDown, ChevronUp, Import, ContactRound
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateId } from '../utils/dateHelpers';
import {
  SERVICE_CATEGORIES,
  detectCategory,
  getCategoryById,
  categorizeContacts
} from '../utils/contactMatcher';
import Modal from '../components/UI/Modal';
import { useApp } from '../context/AppContext';

// ─── Contact Form (Add / Edit) ─────────────────────────────────────────────
function ContactForm({ contact, onSave, onCancel }) {
  const [name, setName] = useState(contact?.name || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [category, setCategory] = useState(contact?.category || '');
  const [notes, setNotes] = useState(contact?.notes || '');

  // Auto-detect category as user types name
  useEffect(() => {
    if (!contact) {
      // Only auto-detect for new contacts
      const detected = detectCategory(name);
      if (detected !== 'other') setCategory(detected);
    }
  }, [name, contact]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      category: category || detectCategory(name),
      notes: notes.trim(),
    });
  };

  const allCategories = [...SERVICE_CATEGORIES, getCategoryById('other')];

  return (
    <form className="sc-form" onSubmit={handleSubmit}>
      <div className="sc-form-group">
        <label className="sc-form-label">Naam *</label>
        <input
          type="text"
          className="sc-form-input"
          placeholder="e.g. Ravi Electrician"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          required
        />
        {name && detectCategory(name) !== 'other' && !contact && (
          <span className="sc-form-detect">
            ✨ Auto-detected: <strong>{getCategoryById(detectCategory(name))?.label}</strong>
          </span>
        )}
      </div>

      <div className="sc-form-group">
        <label className="sc-form-label">Phone Number *</label>
        <input
          type="tel"
          className="sc-form-input"
          placeholder="e.g. 9876543210"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
        />
      </div>

      <div className="sc-form-group">
        <label className="sc-form-label">Category</label>
        <div className="sc-form-categories">
          {allCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`sc-cat-chip ${category === cat.id ? 'sc-cat-chip--active' : ''}`}
              style={{
                '--chip-color': cat.color,
                '--chip-bg': cat.colorBg,
              }}
              onClick={() => setCategory(cat.id)}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sc-form-group">
        <label className="sc-form-label">Notes (optional)</label>
        <input
          type="text"
          className="sc-form-input"
          placeholder="e.g. Visiting charge ₹200, achha kaam karta hai"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div className="sc-form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={!name.trim() || !phone.trim()}>
          {contact ? 'Update' : 'Save Contact'}
        </button>
      </div>
    </form>
  );
}

// ─── Contact Card ──────────────────────────────────────────────────────────
function ContactCard({ contact, onEdit, onDelete, onShare }) {
  const cat = getCategoryById(contact.category);

  const handleCall = () => {
    window.open(`tel:${contact.phone}`, '_self');
  };

  const handleWhatsApp = () => {
    const cleanPhone = contact.phone.replace(/\D/g, '');
    const phone91 = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phone91}`, '_blank');
  };

  return (
    <div className="sc-contact-card">
      <div className="sc-contact-avatar" style={{ background: cat?.colorBg, color: cat?.color }}>
        {cat?.emoji}
      </div>
      <div className="sc-contact-info">
        <div className="sc-contact-name">{contact.name}</div>
        <div className="sc-contact-phone">{contact.phone}</div>
        {contact.notes && <div className="sc-contact-notes">{contact.notes}</div>}
      </div>
      <div className="sc-contact-actions">
        <button className="sc-action-btn sc-action-btn--call" onClick={handleCall} title="Call">
          <Phone size={16} />
        </button>
        <button className="sc-action-btn sc-action-btn--whatsapp" onClick={handleWhatsApp} title="WhatsApp">
          <MessageCircle size={16} />
        </button>
        <button className="sc-action-btn sc-action-btn--share" onClick={() => onShare(contact)} title="Share">
          <Share2 size={14} />
        </button>
        <button className="sc-action-btn sc-action-btn--edit" onClick={() => onEdit(contact)} title="Edit">
          <Edit3 size={14} />
        </button>
        <button className="sc-action-btn sc-action-btn--delete" onClick={() => onDelete(contact.id)} title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Category Section (Collapsible) ─────────────────────────────────────────
function CategorySection({ category, contacts, onEdit, onDelete, onShare }) {
  const [isOpen, setIsOpen] = useState(true);

  if (contacts.length === 0) return null;

  return (
    <div className="sc-category-section">
      <button className="sc-category-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="sc-category-left">
          <span className="sc-category-emoji" style={{ background: category.colorBg }}>
            {category.emoji}
          </span>
          <span className="sc-category-label">{category.label}</span>
          <span className="sc-category-count">{contacts.length}</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {isOpen && (
        <div className="sc-category-contacts">
          {contacts.map(c => (
            <ContactCard
              key={c.id}
              contact={c}
              onEdit={onEdit}
              onDelete={onDelete}
              onShare={onShare}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function ServiceContactsPage() {
  const { showToast } = useApp();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [importing, setImporting] = useState(false);

  // ── Fetch contacts from Supabase ────────────────────────────────────────
  useEffect(() => {
    async function fetchContacts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_contacts')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching service_contacts:', error);
        showToast('Error loading contacts', 'error');
      } else {
        const mapped = (data || []).map(row => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          category: row.category,
          notes: row.notes || '',
          createdAt: row.created_at,
        }));
        setContacts(mapped);
      }
      setLoading(false);
    }
    fetchContacts();
  }, [showToast]);

  // ── Add / Update ────────────────────────────────────────────────────────
  const handleSave = useCallback(async (formData) => {
    if (editingContact) {
      // Update
      const dbPayload = {
        name: formData.name,
        phone: formData.phone,
        category: formData.category,
        notes: formData.notes,
      };
      setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...formData } : c));
      setEditingContact(null);
      setShowForm(false);

      const { error } = await supabase.from('service_contacts').update(dbPayload).eq('id', editingContact.id);
      if (error) {
        showToast('Error updating contact', 'error');
      } else {
        showToast('Contact updated ✓');
      }
    } else {
      // Add new
      const newId = generateId();
      const dbPayload = {
        id: newId,
        name: formData.name,
        phone: formData.phone,
        category: formData.category,
        notes: formData.notes,
      };
      const uiPayload = { ...formData, id: newId, createdAt: new Date().toISOString() };
      setContacts(prev => [...prev, uiPayload].sort((a, b) => a.name.localeCompare(b.name)));
      setShowForm(false);

      const { error } = await supabase.from('service_contacts').insert([dbPayload]);
      if (error) {
        showToast('Error saving contact', 'error');
      } else {
        showToast('Contact saved ✓');
      }
    }
  }, [editingContact, showToast]);

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    setShowDeleteConfirm(null);

    const { error } = await supabase.from('service_contacts').delete().eq('id', id);
    if (error) {
      showToast('Error deleting contact', 'error');
    } else {
      showToast('Contact deleted');
    }
  }, [showToast]);

  // ── Share via WhatsApp ──────────────────────────────────────────────────
  const handleShare = useCallback((contact) => {
    const cat = getCategoryById(contact.category);
    const text = `📞 *${cat?.emoji} ${contact.name}*\n📱 ${contact.phone}${contact.notes ? `\n📝 ${contact.notes}` : ''}\n\n— Shared from Hisaab App`;

    if (navigator.share) {
      navigator.share({
        title: `${contact.name} - ${cat?.label}`,
        text: text,
      }).catch(() => {
        // Fallback to WhatsApp
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  }, []);

  // ── Import from Phone Contacts (Contact Picker API) ─────────────────────
  const handleImportContacts = useCallback(async () => {
    // Check if Contact Picker API is available
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      showToast('Contact import not supported on this device. Use "Add Contact" instead.', 'error');
      return;
    }

    setImporting(true);
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const selectedContacts = await navigator.contacts.select(props, opts);

      if (selectedContacts && selectedContacts.length > 0) {
        let addedCount = 0;
        const newContacts = [];

        for (const c of selectedContacts) {
          const name = c.name?.[0] || '';
          const phone = c.tel?.[0] || '';
          if (!name || !phone) continue;

          // Check if already exists
          const exists = contacts.find(
            existing => existing.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')
          );
          if (exists) continue;

          const newId = generateId();
          const category = detectCategory(name);
          const newContact = {
            id: newId,
            name,
            phone,
            category,
            notes: '',
            createdAt: new Date().toISOString(),
          };
          newContacts.push(newContact);
          addedCount++;
        }

        if (newContacts.length > 0) {
          setContacts(prev =>
            [...prev, ...newContacts].sort((a, b) => a.name.localeCompare(b.name))
          );

          // Save to Supabase
          const dbPayloads = newContacts.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            category: c.category,
            notes: c.notes,
          }));
          const { error } = await supabase.from('service_contacts').insert(dbPayloads);
          if (error) {
            showToast('Error saving imported contacts', 'error');
          } else {
            showToast(`${addedCount} contact${addedCount > 1 ? 's' : ''} imported & auto-sorted! ✨`);
          }
        } else {
          showToast('No new contacts to import (already exist or empty)');
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Contact picker error:', err);
        showToast('Could not access contacts', 'error');
      }
    }
    setImporting(false);
  }, [contacts, showToast]);

  // ── Search + Categorize ─────────────────────────────────────────────────
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [contacts, searchQuery]);

  const grouped = useMemo(() => categorizeContacts(filteredContacts), [filteredContacts]);

  // All categories with contacts + "other"
  const activeCategories = useMemo(() => {
    const cats = [];
    SERVICE_CATEGORIES.forEach(cat => {
      if (grouped[cat.id] && grouped[cat.id].length > 0) {
        cats.push({ ...cat, contacts: grouped[cat.id] });
      }
    });
    if (grouped.other && grouped.other.length > 0) {
      cats.push({ ...getCategoryById('other'), contacts: grouped.other });
    }
    return cats;
  }, [grouped]);

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  return (
    <div className="sc-page animate-fade-in">

      {/* Page header with search */}
      <div className="sc-page-header">
        <div className="sc-header-top">
          <div className="sc-header-info">
            <h2 className="sc-page-title">Service Contacts</h2>
            <p className="sc-page-subtitle">Ghar ke sabhi helper contacts ek jagah</p>
          </div>
          <div className="sc-header-badge">
            <ContactRound size={18} />
            <span>{contacts.length}</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="sc-search-bar">
          <Search size={18} className="sc-search-icon" />
          <input
            type="text"
            className="sc-search-input"
            placeholder="Naam ya number se search karo..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="sc-search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="sc-action-row">
          <button className="sc-import-btn" onClick={handleImportContacts} disabled={importing}>
            <Import size={16} />
            <span>{importing ? 'Importing...' : 'Import Contacts'}</span>
          </button>
          <button className="sc-add-btn" onClick={() => { setEditingContact(null); setShowForm(true); }}>
            <Plus size={18} />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="sc-loading">
          <div className="sc-loading-spinner"></div>
          <p>Loading contacts...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="sc-empty">
          <div className="sc-empty-icon">📇</div>
          <h3 className="sc-empty-title">Koi contact nahi hai</h3>
          <p className="sc-empty-desc">
            Apne ghar ke electrician, plumber, maid, cook ke contacts add karo.
            <br />Phone se import karo ya manually add karo!
          </p>
          <div className="sc-empty-actions">
            <button className="sc-import-btn" onClick={handleImportContacts}>
              <Import size={16} />
              <span>Import from Phone</span>
            </button>
            <button className="sc-add-btn" onClick={() => setShowForm(true)}>
              <UserPlus size={16} />
              <span>Add Manually</span>
            </button>
          </div>
          <div className="sc-empty-tip">
            <span className="sc-empty-tip-icon">💡</span>
            <p>
              <strong>Tip:</strong> Phone me "Ravi Electrician" ya "Sunita Bai" jaise naam se save karo — 
              app automatic sort kar dega!
            </p>
          </div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="sc-no-results">
          <Search size={40} strokeWidth={1.5} />
          <p>"{searchQuery}" se koi contact nahi mila</p>
        </div>
      ) : (
        <div className="sc-contacts-list">
          {activeCategories.map(cat => (
            <CategorySection
              key={cat.id}
              category={cat}
              contacts={cat.contacts}
              onEdit={handleEdit}
              onDelete={(id) => setShowDeleteConfirm(id)}
              onShare={handleShare}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingContact ? 'Edit Contact' : 'Add Service Contact'}
        size="md"
      >
        <ContactForm
          contact={editingContact}
          onSave={handleSave}
          onCancel={handleCloseForm}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Contact?"
        size="sm"
        footer={
          <div className="sc-delete-footer">
            <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
          </div>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Ye contact permanently delete ho jayega. Kya aap sure hain?
        </p>
      </Modal>
    </div>
  );
}
