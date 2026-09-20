'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  CURRENT_USER_ID,
  SEED_CONNECTIONS,
  SEED_MEMBERS,
  SEED_MESSAGES,
  SEED_REQUESTS,
  type ChatMessage,
  type Connection,
  type ConnectionRequest,
  type Member,
  type RequestType,
} from './mock-data';

export { CURRENT_USER_ID };

const STORAGE_KEY = 'upsa-portal-state-v1';

export type Resume = {
  fileName: string;
  sizeLabel: string;
  uploadedAt: string;
} | null;

type PortalState = {
  members: Record<string, Member>;
  requests: ConnectionRequest[];
  connections: Connection[];
  messages: ChatMessage[];
  resume: Resume;
  resumeSharedWith: string[];
  deactivated: boolean;
  identityClaimed: boolean;
};

const SEED_STATE: PortalState = {
  members: SEED_MEMBERS,
  requests: SEED_REQUESTS,
  connections: SEED_CONNECTIONS,
  messages: SEED_MESSAGES,
  resume: { fileName: 'Aisha_Raza_Resume.pdf', sizeLabel: '184 KB', uploadedAt: '3 weeks ago' },
  resumeSharedWith: ['c1'],
  deactivated: false,
  identityClaimed: false,
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(p => p[0]!.toUpperCase()).join('') || 'U';
}

type PortalContextValue = {
  state: PortalState;
  currentUser: Member;
  sendRequest: (toId: string, requestType: RequestType, message: string) => void;
  respondToRequest: (requestId: string, decision: 'accepted' | 'declined') => void;
  cancelRequest: (requestId: string) => void;
  completeConnection: (connectionId: string) => void;
  cancelConnection: (connectionId: string) => void;
  sendMessage: (connectionId: string, text: string) => void;
  updateProfile: (fields: Partial<Member>) => void;
  setResume: (resume: Resume) => void;
  shareResumeWithConnection: (connectionId: string) => void;
  setDeactivated: (value: boolean) => void;
  resetLocalData: () => void;
};

const PortalContext = createContext<PortalContextValue | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalState>(SEED_STATE);
  const [hydrated, setHydrated] = useState(false);
  const { user, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PortalState>;
        if (parsed.members && parsed.requests && parsed.connections && Array.isArray(parsed.resumeSharedWith)) {
          setState({ identityClaimed: false, ...parsed } as PortalState);
        }
      }
    } catch {
      // bad or missing storage, just use the seed data
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage might be full or blocked, not critical, state still works in memory
    }
  }, [state, hydrated]);

  // First time a real Clerk user shows up, replace the seeded demo identity
  // (name/initials/headline) with theirs so the portal isn't showing "Aisha Raza" as them.
  // The mock member id itself stays CURRENT_USER_ID so the seeded requests/connections/
  // messages built around it keep making sense until there's a real backend.
  useEffect(() => {
    if (!hydrated || !userLoaded || !user || state.identityClaimed) return;
    const fullName = user.fullName?.trim();
    if (!fullName) return;

    setState(prev => ({
      ...prev,
      identityClaimed: true,
      members: {
        ...prev.members,
        [CURRENT_USER_ID]: {
          ...prev.members[CURRENT_USER_ID],
          name: fullName,
          initials: initialsFromName(fullName),
          headline: '',
        },
      },
      resume: null,
      resumeSharedWith: [],
    }));
  }, [hydrated, userLoaded, user, state.identityClaimed]);

  const currentUser = state.members[CURRENT_USER_ID];

  const value: PortalContextValue = {
    state,
    currentUser,

    sendRequest(toId, requestType, message) {
      setState(prev => ({
        ...prev,
        requests: [
          ...prev.requests,
          {
            id: uid('r'),
            fromId: CURRENT_USER_ID,
            toId,
            requestType,
            message,
            status: 'pending',
            createdAt: 'Just now',
          },
        ],
      }));
    },

    respondToRequest(requestId, decision) {
      setState(prev => {
        const request = prev.requests.find(r => r.id === requestId);
        const requests = prev.requests.map(r => (r.id === requestId ? { ...r, status: decision } : r));
        if (decision === 'accepted' && request) {
          const connection: Connection = {
            id: uid('c'),
            requestId,
            memberIds: [request.fromId, request.toId],
            status: 'active',
            since: 'Just now',
          };
          return { ...prev, requests, connections: [...prev.connections, connection] };
        }
        return { ...prev, requests };
      });
    },

    cancelRequest(requestId) {
      setState(prev => ({
        ...prev,
        requests: prev.requests.map(r => (r.id === requestId ? { ...r, status: 'cancelled' } : r)),
      }));
    },

    completeConnection(connectionId) {
      setState(prev => ({
        ...prev,
        connections: prev.connections.map(c => (c.id === connectionId ? { ...c, status: 'completed' } : c)),
      }));
    },

    cancelConnection(connectionId) {
      setState(prev => ({
        ...prev,
        connections: prev.connections.map(c => (c.id === connectionId ? { ...c, status: 'cancelled' } : c)),
      }));
    },

    sendMessage(connectionId, text) {
      const trimmed = text.trim();
      if (!trimmed) return;
      setState(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: uid('m'), connectionId, senderId: CURRENT_USER_ID, text: trimmed, time: 'Just now' },
        ],
      }));
    },

    updateProfile(fields) {
      setState(prev => ({
        ...prev,
        members: {
          ...prev.members,
          [CURRENT_USER_ID]: { ...prev.members[CURRENT_USER_ID], ...fields },
        },
      }));
    },

    setResume(resume) {
      setState(prev => ({ ...prev, resume }));
    },

    shareResumeWithConnection(connectionId) {
      setState(prev => ({
        ...prev,
        resumeSharedWith: prev.resumeSharedWith.includes(connectionId)
          ? prev.resumeSharedWith
          : [...prev.resumeSharedWith, connectionId],
      }));
    },

    setDeactivated(deactivated) {
      setState(prev => ({ ...prev, deactivated }));
    },

    resetLocalData() {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      setState(SEED_STATE);
    },
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortalData() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortalData must be used within PortalDataProvider');
  return ctx;
}
