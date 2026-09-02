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
    const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (currentVersion !== 'v8.0_clean_manual_slate') {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_CLASS_SETTINGS));
      localStorage.setItem(STORAGE_KEYS.VERSION, 'v8.0_clean_manual_slate');
    }
  } catch (e) {
    console.error('Error migrating storage:', e);
  }
}

// Run migration immediately
ensureUpToDateStorage();

export const storageService = {
  getStudents(): Student[] {
    ensureUpToDateStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STUDENTS;
    }
  },

  saveStudents(students: Student[], broadcast = true): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    if (broadcast) this.broadcastEvent({ type: 'STUDENT_UPDATED', timestamp: Date.now() });
  },

  getPayments(): Payment[] {
    ensureUpToDateStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
      return INITIAL_PAYMENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PAYMENTS;
    }
  },

  savePayments(payments: Payment[], broadcast = true): void {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    if (broadcast) this.broadcastEvent({ type: 'PAYMENT_UPDATED', timestamp: Date.now() });
  },

  getExpenses(): Expense[] {
    ensureUpToDateStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_EXPENSES;
    }
  },

  saveExpenses(expenses: Expense[], broadcast = true): void {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    if (broadcast) this.broadcastEvent({ type: 'EXPENSE_UPDATED', timestamp: Date.now() });
  },

  getSettings(): ClassSettings {
    ensureUpToDateStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_CLASS_SETTINGS));
      return INITIAL_CLASS_SETTINGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CLASS_SETTINGS;
    }
  },

  saveSettings(settings: ClassSettings, broadcast = true): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (broadcast) this.broadcastEvent({ type: 'SETTINGS_UPDATED', timestamp: Date.now() });
  },

  getUsers(): User[] {
    ensureUpToDateStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_CLASS_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.VERSION, 'v8.0_clean_manual_slate');
    this.broadcastEvent({ type: 'DATA_RESET', timestamp: Date.now() });
  },

  broadcastEvent(message: RealtimeMessage): void {
    try {
      if (broadcastChannel) {
        broadcastChannel.postMessage(message);
      }
      // Also dispatch a custom window event for same-tab subscribers
      window.dispatchEvent(new CustomEvent('kaskelas_realtime_local', { detail: message }));
    } catch (e) {
      console.error('Error broadcasting realtime event:', e);
    }
  },

  subscribeRealtime(callback: (message: RealtimeMessage) => void): () => void {
    const channelHandler = (event: MessageEvent<RealtimeMessage>) => {
      callback(event.data);
    };

    const windowHandler = (event: Event) => {
      const customEv = event as CustomEvent<RealtimeMessage>;
      if (customEv.detail) callback(customEv.detail);
    };

    const storageHandler = (event: StorageEvent) => {
      if (event.key && event.key.startsWith('kaskelas_')) {
        callback({ type: 'FULL_SYNC', timestamp: Date.now() });
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', channelHandler);
    }
    window.addEventListener('kaskelas_realtime_local', windowHandler);
    window.addEventListener('storage', storageHandler);

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', channelHandler);
      }
      window.removeEventListener('kaskelas_realtime_local', windowHandler);
      window.removeEventListener('storage', storageHandler);
    };
  }
};
