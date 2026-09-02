import { Student, Payment, Expense, User, ClassSettings } from '../types';
import { INITIAL_STUDENTS, INITIAL_PAYMENTS, INITIAL_EXPENSES, INITIAL_USERS, INITIAL_CLASS_SETTINGS } from '../data/initialData';

const STORAGE_KEYS = {
  VERSION: 'kaskelas_version_v8_clean',
  STUDENTS: 'kaskelas_students_v8',
  PAYMENTS: 'kaskelas_payments_v8',
  EXPENSES: 'kaskelas_expenses_v8',
  USERS: 'kaskelas_users_v8',
  SETTINGS: 'kaskelas_settings_v8',
  CURRENT_USER: 'kaskelas_current_user_v8',
};

// In-memory fallback memory store for browsers with restricted storage (Brave shields / Private mode / Quota exceeded)
const memoryStore: Record<string, string> = {
  [STORAGE_KEYS.STUDENTS]: JSON.stringify(INITIAL_STUDENTS),
  [STORAGE_KEYS.PAYMENTS]: JSON.stringify(INITIAL_PAYMENTS),
  [STORAGE_KEYS.EXPENSES]: JSON.stringify(INITIAL_EXPENSES),
  [STORAGE_KEYS.USERS]: JSON.stringify(INITIAL_USERS),
  [STORAGE_KEYS.SETTINGS]: JSON.stringify(INITIAL_CLASS_SETTINGS),
  [STORAGE_KEYS.VERSION]: 'v8.0_clean_manual_slate',
};

// Safe Storage Helper
function safeGet(key: string): string | null {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) {
      memoryStore[key] = val;
      return val;
    }
  } catch (e) {
    console.warn('localStorage read failed, using memory store:', e);
  }
  return memoryStore[key] || null;
}

function safeSet(key: string, value: string): void {
  memoryStore[key] = value;
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    console.warn('localStorage write failed, clearing obsolete keys and falling back:', e);
    // If quota exceeded, try cleaning old keys
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('kaskelas_') && !k.includes('_v8')) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(key, value);
    } catch {
      // Memory store is already updated
    }
  }
}

function safeRemove(key: string): void {
  delete memoryStore[key];
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// Create a BroadcastChannel for instantaneous cross-tab/cross-window realtime synchronization
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('kaskelas_realtime_sync');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported or error initializing:', e);
}

export interface RealtimeMessage {
  type: 'PAYMENT_ADDED' | 'PAYMENT_UPDATED' | 'PAYMENT_DELETED' | 
        'EXPENSE_ADDED' | 'EXPENSE_UPDATED' | 'EXPENSE_DELETED' | 
        'STUDENT_ADDED' | 'STUDENT_UPDATED' | 'STUDENT_DELETED' | 
        'SETTINGS_UPDATED' | 'DATA_RESET' | 'FULL_SYNC';
  timestamp: number;
  payload?: any;
}

// Auto migration helper: cleans old dummy keys if version changed
function ensureUpToDateStorage(): void {
  try {
    const currentVersion = safeGet(STORAGE_KEYS.VERSION);
    if (currentVersion !== 'v8.0_clean_manual_slate') {
      safeSet(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      safeSet(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
      safeSet(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      safeSet(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_CLASS_SETTINGS));
      safeSet(STORAGE_KEYS.VERSION, 'v8.0_clean_manual_slate');
    }
  } catch (e) {
    console.error('Error migrating storage:', e);
  }
}

// Run migration safely
ensureUpToDateStorage();

export const storageService = {
  getStudents(): Student[] {
    ensureUpToDateStorage();
    const raw = safeGet(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      safeSet(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
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
    ensureUpToDateStorage();
    const raw = safeGet(STORAGE_KEYS.PAYMENTS);
    if (!raw) {
      safeSet(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
      return INITIAL_PAYMENTS;
    }
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
    ensureUpToDateStorage();
    const raw = safeGet(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      safeSet(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
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
    ensureUpToDateStorage();
    const raw = safeGet(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_CLASS_SETTINGS));
      return INITIAL_CLASS_SETTINGS;
    }
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
    ensureUpToDateStorage();
    const raw = safeGet(STORAGE_KEYS.USERS);
    if (!raw) {
      safeSet(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
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

  resetToDefault(): void {
    safeSet(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    safeSet(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    safeSet(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_CLASS_SETTINGS));
    safeSet(STORAGE_KEYS.VERSION, 'v8.0_clean_manual_slate');
    this.broadcastEvent({ type: 'DATA_RESET', timestamp: Date.now() });
  },

  // Broadcast event to other tabs
  broadcastEvent(message: RealtimeMessage): void {
    try {
      if (broadcastChannel) {
        broadcastChannel.postMessage(message);
      }
    } catch (e) {
      console.warn('Error broadcasting message:', e);
    }
  },

  // Subscribe to realtime updates from other tabs
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
