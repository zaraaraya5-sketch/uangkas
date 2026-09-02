import { Student, Payment, Expense, User, ClassSettings } from '../types';
import { INITIAL_STUDENTS, INITIAL_PAYMENTS, INITIAL_EXPENSES, INITIAL_USERS, INITIAL_CLASS_SETTINGS } from '../data/initialData';

const STORAGE_KEYS = {
  VERSION: 'kaskelas_v9_permanent',
  STUDENTS: 'kaskelas_students_v9',
  PAYMENTS: 'kaskelas_payments_v9',
  EXPENSES: 'kaskelas_expenses_v9',
  USERS: 'kaskelas_users_v9',
  SETTINGS: 'kaskelas_settings_v9',
  CURRENT_USER: 'kaskelas_current_user_v9',
  CURRENT_VIEW: 'kaskelas_current_view_v9',
  ACTIVE_TAB: 'kaskelas_active_admin_tab_v9',
};

// In-memory fallback memory store (synced with localStorage)
const memoryStore: Record<string, string> = {
  [STORAGE_KEYS.STUDENTS]: JSON.stringify(INITIAL_STUDENTS),
  [STORAGE_KEYS.PAYMENTS]: JSON.stringify(INITIAL_PAYMENTS),
  [STORAGE_KEYS.EXPENSES]: JSON.stringify(INITIAL_EXPENSES),
  [STORAGE_KEYS.USERS]: JSON.stringify(INITIAL_USERS),
  [STORAGE_KEYS.SETTINGS]: JSON.stringify(INITIAL_CLASS_SETTINGS),
  [STORAGE_KEYS.VERSION]: 'v9_permanent_store',
};

// Safe Storage Helper (Reads from localStorage, fallbacks to memory)
function safeGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null && val !== undefined) {
        memoryStore[key] = val;
        return val;
      }
    }
  } catch (e) {
    console.warn('localStorage get failed, falling back to memory:', e);
  }
  return memoryStore[key] !== undefined ? memoryStore[key] : null;
}

function safeSet(key: string, value: string): void {
  memoryStore[key] = value;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e: any) {
    console.warn('localStorage set failed, using memory store fallback:', e);
    try {
      // If quota issue, clean old legacy versions
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith('kaskelas_') && !k.includes('_v9')) {
          window.localStorage.removeItem(k);
        }
      }
      window.localStorage.setItem(key, value);
    } catch {
      // Memory store is already kept
    }
  }
}

function safeRemove(key: string): void {
  delete memoryStore[key];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
}

// Create a BroadcastChannel for instantaneous cross-tab synchronization
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('kaskelas_realtime_sync');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported:', e);
}

export interface RealtimeMessage {
  type: 'PAYMENT_ADDED' | 'PAYMENT_UPDATED' | 'PAYMENT_DELETED' | 
        'EXPENSE_ADDED' | 'EXPENSE_UPDATED' | 'EXPENSE_DELETED' | 
        'STUDENT_ADDED' | 'STUDENT_UPDATED' | 'STUDENT_DELETED' | 
        'SETTINGS_UPDATED' | 'DATA_RESET' | 'FULL_SYNC';
  timestamp: number;
  payload?: any;
}

// Ensure storage has initial keys once, NEVER overwrite user data on reload
function initStorageOnce(): void {
  const version = safeGet(STORAGE_KEYS.VERSION);
  if (!version) {
    safeSet(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    safeSet(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    safeSet(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    safeSet(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_CLASS_SETTINGS));
    safeSet(STORAGE_KEYS.VERSION, 'v9_permanent_store');
  }
}

initStorageOnce();

export const storageService = {
  getStudents(): Student[] {
    const raw = safeGet(STORAGE_KEYS.STUDENTS);
    if (!raw) return INITIAL_STUDENTS;
    try {
      return JSON.parse(raw);
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
      return JSON.parse(raw);
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
      return JSON.parse(raw);
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
    return safeGet(STORAGE_KEYS.CURRENT_VIEW);
  },

  saveCurrentView(view: string): void {
    safeSet(STORAGE_KEYS.CURRENT_VIEW, view);
  },

  getActiveAdminTab(): string | null {
    return safeGet(STORAGE_KEYS.ACTIVE_TAB);
  },

  saveActiveAdminTab(tab: string): void {
    safeSet(STORAGE_KEYS.ACTIVE_TAB, tab);
  },

  resetToDefault(): void {
    safeSet(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    safeSet(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    safeSet(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_CLASS_SETTINGS));
    safeSet(STORAGE_KEYS.VERSION, 'v9_permanent_store');
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
