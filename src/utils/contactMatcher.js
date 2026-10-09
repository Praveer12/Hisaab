/**
 * Smart Contact Categorization Engine
 * Matches contact names against occupation keywords (Hindi + English)
 * to auto-sort them into service categories.
 */

export const SERVICE_CATEGORIES = [
  {
    id: 'electrician',
    label: 'Electrician',
    labelHi: 'Bijli Wala',
    emoji: '⚡',
    color: '#F59E0B',
    colorBg: '#FFFBEB',
    keywords: ['electrician', 'bijli', 'wiring', 'light', 'electric', 'electri'],
  },
  {
    id: 'plumber',
    label: 'Plumber',
    labelHi: 'Nal / Pipe',
    emoji: '🔧',
    color: '#3B82F6',
    colorBg: '#EFF6FF',
    keywords: ['plumber', 'nal', 'pipe', 'motor', 'water', 'tank', 'nalkha', 'plumbing'],
  },
  {
    id: 'maid',
    label: 'Maid',
    labelHi: 'Kaamwali Bai',
    emoji: '🧹',
    color: '#EC4899',
    colorBg: '#FDF2F8',
    keywords: ['maid', 'bai', 'kamwali', 'kaamwali', 'safai', 'pocha', 'jhadu', 'cleaning', 'helper'],
  },
  {
    id: 'cook',
    label: 'Cook',
    labelHi: 'Rasoiya',
    emoji: '👨‍🍳',
    color: '#F97316',
    colorBg: '#FFF7ED',
    keywords: ['cook', 'rasoiya', 'khana', 'chef', 'tiffin', 'rasoi', 'maharaj'],
  },
  {
    id: 'carpenter',
    label: 'Carpenter / Mistri',
    labelHi: 'Mistri',
    emoji: '🔨',
    color: '#78716C',
    colorBg: '#F5F5F4',
    keywords: ['mistri', 'carpenter', 'wood', 'thekedar', 'rajmistri', 'raj mistri', 'labour', 'mazdoor', 'karigar'],
  },
  {
    id: 'ac_repair',
    label: 'AC / Appliance',
    labelHi: 'AC Repair',
    emoji: '❄️',
    color: '#0EA5E9',
    colorBg: '#F0F9FF',
    keywords: ['ac', 'fridge', 'cooler', 'washing', 'machine', 'repair', 'mechanic', 'appliance', 'service', 'technician'],
  },
  {
    id: 'dhobi',
    label: 'Dhobi / Laundry',
    labelHi: 'Dhobi',
    emoji: '🧺',
    color: '#8B5CF6',
    colorBg: '#F5F3FF',
    keywords: ['dhobi', 'press', 'iron', 'dry clean', 'laundry', 'kapda', 'washing'],
  },
  {
    id: 'milkman',
    label: 'Doodhwala',
    labelHi: 'Doodh Wala',
    emoji: '🥛',
    color: '#0D9488',
    colorBg: '#F0FDFA',
    keywords: ['doodh', 'milk', 'dairy', 'gawala', 'doodhwala', 'gwala', 'dudh'],
  },
  {
    id: 'driver',
    label: 'Driver / Car',
    labelHi: 'Driver',
    emoji: '🚗',
    color: '#6366F1',
    colorBg: '#EEF2FF',
    keywords: ['driver', 'car wash', 'gadi', 'cab', 'taxi', 'car cleaner', 'carwash'],
  },
  {
    id: 'medical',
    label: 'Doctor / Chemist',
    labelHi: 'Doctor / Dawa',
    emoji: '💊',
    color: '#EF4444',
    colorBg: '#FEF2F2',
    keywords: ['chemist', 'medical', 'dawa', 'doctor', 'dr.', 'dr ', 'pharmacy', 'clinic', 'hospital', 'dawai'],
  },
  {
    id: 'gardener',
    label: 'Gardener / Mali',
    labelHi: 'Mali',
    emoji: '🌿',
    color: '#22C55E',
    colorBg: '#F0FDF4',
    keywords: ['mali', 'garden', 'gardener', 'plant', 'lawn'],
  },
  {
    id: 'guard',
    label: 'Security Guard',
    labelHi: 'Chowkidar',
    emoji: '🛡️',
    color: '#64748B',
    colorBg: '#F8FAFC',
    keywords: ['guard', 'security', 'chowkidar', 'watchman'],
  },
];

/**
 * Detects service category from a contact name.
 * Returns the category id or 'other' if no match found.
 * @param {string} contactName
 * @returns {string} category id
 */
export function detectCategory(contactName) {
  if (!contactName) return 'other';
  const name = contactName.toLowerCase().trim();

  for (const cat of SERVICE_CATEGORIES) {
    for (const keyword of cat.keywords) {
      if (name.includes(keyword)) {
        return cat.id;
      }
    }
  }
  return 'other';
}

/**
 * Get category object by id
 * @param {string} categoryId 
 * @returns {object|null}
 */
export function getCategoryById(categoryId) {
  if (categoryId === 'other') {
    return {
      id: 'other',
      label: 'Other',
      labelHi: 'Anya',
      emoji: '📋',
      color: '#94A3B8',
      colorBg: '#F8FAFC',
      keywords: [],
    };
  }
  return SERVICE_CATEGORIES.find(c => c.id === categoryId) || null;
}

/**
 * Categorize an array of contacts
 * Each contact should have at least { name, phone }
 * Returns Map<categoryId, contact[]>
 */
export function categorizeContacts(contacts) {
  const grouped = {};

  // Init all categories
  SERVICE_CATEGORIES.forEach(cat => {
    grouped[cat.id] = [];
  });
  grouped['other'] = [];

  contacts.forEach(contact => {
    const catId = contact.category || detectCategory(contact.name);
    if (!grouped[catId]) grouped[catId] = [];
    grouped[catId].push(contact);
  });

  return grouped;
}
