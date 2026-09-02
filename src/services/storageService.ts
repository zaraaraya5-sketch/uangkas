import { Student, Payment, Expense, User, ClassSettings } from '../types';
import { INITIAL_STUDENTS, INITIAL_PAYMENTS, INITIAL_EXPENSES, INITIAL_USERS, INITIAL_CLASS_SETTINGS } from '../data/initialData';

const STORAGE_KEYS = {
  VERSION: 'kk_v10_db',
  STUDENTS: 'kk_students_v10',
  PAYMENTS: 'kk_payments_v10',
  EXPENSES: 'kk_expenses_v10',
  USERS: 'kk_users_v10',
  SETTINGS: 'kk_settings_v10',
  CURRENT_USER: 'kk_curr_user_v10',
  CURRENT_VIEW: 'kk_curr_view_v10',
  ACTIVE_TAB: 'kk_active_tab_v10',
};

// Clean legacy bloated keys from localhost storage to free up space
function purgeBloat(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && !k.startsWith('kk_')) {
        // Old versions or other projects
        if (k.startsWith('kaskelas_') || k.startsWith('baraza') || k.length > 50) {
          keysToRemove.push(k);
        }
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch (e) {
    console.warn('Could not purge bloat:', e);
  }
}

purgeBloat();

// Memory store in-sync
const memCache: Record<string, string> = {};

// Open IndexedDB database for permanent backup
const DB_NAME = 'KasKelasDB';
const DB_VERSION = 1;
const STORE_NAME = 'kv_store';

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Write to IndexedDB async in background
async function idbSet(key: string, value: string): Promise<void> {
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
  } catch (e) {
    console.warn('IDB write error:', e);
  }
}

// Read from LocalStorage or Memory
function safeGet(key: string, defaultVal: string = ''): string {
  if (memCache[key] !== undefined) {
    return memCache[key];
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null && val !== undefined) {
        memCache[key] = val;
        return val;
      }
    }
  } catch (e) {
    console.warn('safeGet failed:', e);
  }
  return defaultVal;
}

// Write to LocalStorage + Memory + IndexedDB
function safeSet(key: string, value: string): void {
  memCache[key] = value;
  
  // 1. Write to localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('localStorage set failed, purging and retrying:', e);
    purgeBloat();
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Memory cache + IDB will preserve it
    }
  }

  // 2. Write to IndexedDB permanently
  idbSet(key, value);
}

function safeRemove(key: string): void {
  delete memCache[key];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
  // Remove from IDB
  try {
    openDB().then((db) => {
      if (db) {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(key);
      }
    });
  } catch {
    // Ignore
  }
}

// Realtime cross-tab broadcast
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('kaskelas_sync_v10');
  }
} catch (e) {
  console.warn('BroadcastChannel error:', e);
}

export interface RealtimeMessage {
  type: 'PAYMENT_ADDED' | 'PAYMENT_UPDATED' | 'PAYMENT_DELETED' | 
        'EXPENSE_ADDED' | 'EXPENSE_UPDATED' | 'EXPENSE_DELETED' | 
        'STUDENT_ADDED' | 'STUDENT_UPDATED' | 'STUDENT_DELETED' | 
        'SETTINGS_UPDATED' | 'DATA_RESET' | 'FULL_SYNC';
  timestamp: number;
  payload?: any;
}

// Load initial data if not present
function initializeState(): void {
  const version = safeGet(STORAGE_KEYS.VERSION);
  if (!version) {
    safeSet(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    safeSet(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    safeSet(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    safeSet(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_CLASS_SETTINGS));
    safeSet(STORAGE_KEYS.VERSION, 'v10_ready');
  }
}

initializeState();

export const storageService = {
  getStudents(): Student[] {
    const raw = safeGet(STORAGE_KEYS.STUDENTS);
    if (!raw) return INITIAL_STUDENTS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  },

  saveStudents(students: Student[], broadcast = true): void {
    safeSet(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    if (broadcast) this.broadcastEvent({ type: 'STUDENT_UPDATED', timestamp: Date.now() });
  },

  getPayments(): Payment[] {
    const raw = safeGet(STORAGE_KEYS.PAYMENTS);
    if (!raw) return INITIAL_PAYMENTS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  },

  savePayments(payments: Payment[], broadcast = true): void {
    safeSet(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    if (broadcast) this.broadcastEvent({ type: 'PAYMENT_UPDATED', timestamp: Date.now() });
  },

  getExpenses(): Expense[] {
    const raw = safeGet(STORAGE_KEYS.EXPENSES);
    if (!raw) return INITIAL_EXPENSES;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  },

  saveExpenses(expenses: Expense[], broadcast = true): void {
    safeSet(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    if (broadcast) this.broadcastEvent({ type: 'EXPENSE_UPDATED', timestamp: Date.now() });
  },

  getSettings(): ClassSettings {
    const raw = safeGet(STORAGE_KEYS.SETTINGS);
    if (!raw) return INITIAL_CLASS_SETTINGS;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CLASS_SETTINGS;
    }
  },

  saveSettings(settings: ClassSettings, broadcast = true): void {
    safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (broadcast) this.broadcastEvent({ type: 'SETTINGS_UPDATED', timestamp: Date.now() });
  },

  getUsers(): User[] {
    const raw = safeGet(STORAGE_KEYS.USERS);
    if (!raw) return INITIAL_USERS;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: User[]): void {
    safeSet(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUser(): User | null {
    const raw = safeGet(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveCurrentUser(user: User | null): void {
    if (user) {
      safeSet(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      safeRemove(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getCurrentView(): string | null {
    const v = safeGet(STORAGE_KEYS.CURRENT_VIEW);
    return v || null;
  },

  saveCurrentView(view: string): void {
    safeSet(STORAGE_KEYS.CURRENT_VIEW, view);
  },

  getActiveAdminTab(): string | null {
    const t = safeGet(STORAGE_KEYS.ACTIVE_TAB);
    return t || null;
  },

  saveActiveAdminTab(tab: string): void {
    safeSet(STORAGE_KEYS.ACTIVE_TAB, tab);
  },

  resetToDefault(): void {
    safeSet(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    safeSet(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    safeSet(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_CLASS_SETTINGS));
    safeSet(STORAGE_KEYS.VERSION, 'v10_ready');
    this.broadcastEvent({ type: 'DATA_RESET', timestamp: Date.now() });
  },

  broadcastEvent(message: RealtimeMessage): void {
    try {
      if (broadcastChannel) {
        broadcastChannel.postMessage(message);
      }
    } catch (e) {
      console.warn('Error broadcasting message:', e);
    }
  },

  subscribeRealtime(callback: (message: RealtimeMessage) => void): () => void {
    if (!broadcastChannel) {
      return () => {};
    }

    const handler = (event: MessageEvent<RealtimeMessage>) => {
      callback(event.data);
    };

    broadcastChannel.addEventListener('message', handler);

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handler);
      }
    };
  },
};
