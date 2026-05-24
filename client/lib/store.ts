import { create } from 'zustand';
import api from './api';
import { User, DocumentType, UserPresence } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  initializeAuth: () => void;
}

interface DocState {
  documents: DocumentType[];
  isDocsLoading: boolean;
  docsError: string | null;
  fetchDocuments: () => Promise<void>;
  createDocument: (title?: string) => Promise<DocumentType | null>;
  renameDocument: (id: string, title: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  shareDocument: (id: string, email: string, role: 'editor' | 'viewer') => Promise<void>;
}

interface CollabState {
  roomUsers: UserPresence[];
  setRoomUsers: (users: UserPresence[]) => void;
  addRoomUser: (user: UserPresence) => void;
  removeRoomUser: (socketId: string) => void;
  updateRoomUserCursor: (socketId: string, cursor: any) => void;
}

type AppStore = AuthState & DocState & CollabState;

export const useStore = create<AppStore>((set, get) => ({
  // --- Auth State ---
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isAuthLoading: true,

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isAuthLoading: false,
    });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAuthLoading: false,
      documents: [],
      roomUsers: [],
    });
  },

  initializeAuth: () => {
    if (typeof window === 'undefined') return;

    try {
      const userStr = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (userStr && accessToken && refreshToken) {
        set({
          user: JSON.parse(userStr),
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isAuthLoading: false,
        });
      } else {
        set({ isAuthLoading: false });
      }
    } catch (e) {
      console.error('Error initializing auth state from localStorage:', e);
      set({ isAuthLoading: false });
    }
  },

  // --- Documents State ---
  documents: [],
  isDocsLoading: false,
  docsError: null,

  fetchDocuments: async () => {
    set({ isDocsLoading: true, docsError: null });
    try {
      const res = await api.get<DocumentType[]>('/docs');
      set({ documents: res.data, isDocsLoading: false });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch documents';
      set({ docsError: errorMsg, isDocsLoading: false });
    }
  },

  createDocument: async (title) => {
    set({ isDocsLoading: true, docsError: null });
    try {
      const res = await api.post<DocumentType>('/docs', { title });
      const currentDocs = get().documents;
      set({ documents: [res.data, ...currentDocs], isDocsLoading: false });
      return res.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to create document';
      set({ docsError: errorMsg, isDocsLoading: false });
      return null;
    }
  },

  renameDocument: async (id, title) => {
    try {
      const res = await api.put<DocumentType>(`/docs/${id}`, { title });
      const currentDocs = get().documents.map((doc) =>
        doc._id === id ? { ...doc, title: res.data.title } : doc
      );
      set({ documents: currentDocs });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update title');
    }
  },

  deleteDocument: async (id) => {
    try {
      await api.delete(`/docs/${id}`);
      const currentDocs = get().documents.filter((doc) => doc._id !== id);
      set({ documents: currentDocs });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete document');
    }
  },

  shareDocument: async (id, email, role) => {
    try {
      await api.post(`/docs/${id}/share`, { email, role });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to share document');
    }
  },

  // --- Collaborative Room State ---
  roomUsers: [],
  setRoomUsers: (roomUsers) => set({ roomUsers }),
  
  addRoomUser: (user) => {
    const current = get().roomUsers;
    if (!current.some((u) => u.socketId === user.socketId)) {
      set({ roomUsers: [...current, user] });
    }
  },

  removeRoomUser: (socketId) => {
    const current = get().roomUsers;
    set({ roomUsers: current.filter((u) => u.socketId !== socketId) });
  },

  updateRoomUserCursor: (socketId, cursor) => {
    const current = get().roomUsers;
    set({
      roomUsers: current.map((u) =>
        u.socketId === socketId ? { ...u, cursor } : u
      ),
    });
  },
}));

// Listen to custom api.ts logout events
if (typeof window !== 'undefined') {
  window.addEventListener('auth-logout', () => {
    useStore.getState().logout();
  });
}
export default useStore;
