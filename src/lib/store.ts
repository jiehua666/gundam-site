import { create } from 'zustand';
import { verifyToken } from './auth';

export interface User {
  id: string;
  username: string;
  nickname: string;
  email?: string;
  avatar?: string;
  role: string;
  level: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    user: null,
    isAuthenticated: false,
    setUser: (user) => {
      console.log('[AuthStore] setUser called:', user);
      set({ user, isAuthenticated: !!user });
      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('auth_user');
      }
    },
    logout: () => {
      console.log('[AuthStore] logout called');
      set({ user: null, isAuthenticated: false });
      localStorage.removeItem('auth_user');
      // Clear auth_token cookie
      document.cookie = 'auth_token=; path=/; max-age=0';
    },
    checkAuth: async () => {
      // Verify JWT by calling API
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            set({ user: data.user, isAuthenticated: true });
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            return true;
          }
        }
        // Token invalid or expired
        set({ user: null, isAuthenticated: false });
        localStorage.removeItem('auth_user');
        return false;
      } catch {
        set({ user: null, isAuthenticated: false });
        return false;
      }
    },
  })
);

// Notification Store - 全局通知状态
interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  clearUnread: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  clearUnread: () => set({ unreadCount: 0 }),
}));

// Initialize from localStorage but verify on mount
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('auth_user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      console.log('[AuthStore] Found stored user, will verify on mount:', user);
      // Don't auto-restore here - will verify via checkAuth
      useAuthStore.setState({ user, isAuthenticated: true });
    } catch (e) {
      console.error('[AuthStore] Failed to parse stored user:', e);
      localStorage.removeItem('auth_user');
    }
  }
}