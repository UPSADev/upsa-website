'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { apiDownload, apiRequest } from './api';
import {
  AVATAR_COLORS,
  type ChatMessage,
  type Connection,
  type ConnectionRequest,
  type Member,
  type RequestType,
  type Resume,
} from './types';

// Same public/guest routes middleware.ts leaves unauthenticated - these
// never need real portal data, so the provider shouldn't block on them.
function isPublicPortalRoute(pathname: string | null) {
  if (pathname === null) return true;
  return pathname === '/portal' || pathname.startsWith('/portal/sign-in') || pathname.startsWith('/portal/sign-up');
}

// --- raw API response shapes ---------------------------------------------

type ApiAvailability = { mentor: boolean; networking: boolean; referrals: boolean };

type ApiProfile = {
  id: number;
  name: string;
  headline: string;
  university: string;
  major: string;
  company: string;
  role: string;
  industry: string;
  location: string;
  bio: string;
  skills: string[];
  availability: ApiAvailability;
  isProfessional: boolean;
  deactivated: boolean;
};

type ApiRequest = {
  id: number;
  fromId: number;
  toId: number;
  requestType: RequestType;
  message: string;
  status: ConnectionRequest['status'];
  createdAt: string;
};

type ApiConnection = {
  id: number;
  requestId: number;
  memberIds: number[];
  status: Connection['status'];
  since: string;
};

type ApiMessage = {
  id: number;
  connectionId: number;
  senderId: number;
  text: string;
  createdAt: string;
};

type ApiResume = {
  id: number;
  fileName: string;
  sizeLabel: string;
  uploadedAt: string;
  sharedWith: number[];
} | null;

type Paginated<T> = { results: T[] } | T[];

function resultsOf<T>(data: Paginated<T>): T[] {
  return Array.isArray(data) ? data : data.results;
}

// --- mapping helpers: API shape -> frontend shape --------------------------

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(p => p[0]!.toUpperCase()).join('') || 'U';
}

// The backend doesn't store a color, so pick one deterministically from the
// id - same person always lands on the same color without needing a column.
function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(iso: string): string {
  const diffSec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = diffSec / 60;
  if (diffMin < 60) return `${Math.round(diffMin)} minute${Math.round(diffMin) === 1 ? '' : 's'} ago`;
  const diffHr = diffMin / 60;
  if (diffHr < 24) return `${Math.round(diffHr)} hour${Math.round(diffHr) === 1 ? '' : 's'} ago`;
  const diffDay = diffHr / 24;
  if (diffDay < 7) return `${Math.round(diffDay)} day${Math.round(diffDay) === 1 ? '' : 's'} ago`;
  const diffWeek = diffDay / 7;
  if (diffWeek < 5) return `${Math.round(diffWeek)} week${Math.round(diffWeek) === 1 ? '' : 's'} ago`;
  const diffMonth = diffDay / 30;
  if (diffMonth < 12) return `${Math.round(diffMonth)} month${Math.round(diffMonth) === 1 ? '' : 's'} ago`;
  const diffYear = diffDay / 365;
  return `${Math.round(diffYear)} year${Math.round(diffYear) === 1 ? '' : 's'} ago`;
}

function toMember(p: ApiProfile): Member {
  const name = p.name || 'New member';
  return {
    id: String(p.id),
    name,
    initials: initialsFromName(name),
    avatarColor: colorForId(String(p.id)),
    headline: p.headline || '',
    university: p.university || '',
    major: p.major || undefined,
    company: p.company || undefined,
    role: p.role || undefined,
    industry: p.industry || undefined,
    location: p.location || undefined,
    bio: p.bio || '',
    skills: p.skills ?? [],
    availability: p.availability,
    isProfessional: p.isProfessional,
    visible: !p.deactivated,
  };
}

function toRequest(r: ApiRequest): ConnectionRequest {
  return {
    id: String(r.id),
    fromId: String(r.fromId),
    toId: String(r.toId),
    requestType: r.requestType,
    message: r.message,
    status: r.status,
    createdAt: timeAgo(r.createdAt),
  };
}

function toConnection(c: ApiConnection): Connection {
  return {
    id: String(c.id),
    requestId: String(c.requestId),
    memberIds: [String(c.memberIds[0]), String(c.memberIds[1])],
    status: c.status,
    since: timeAgo(c.since),
  };
}

function toChatMessage(m: ApiMessage): ChatMessage {
  return {
    id: String(m.id),
    connectionId: String(m.connectionId),
    senderId: String(m.senderId),
    text: m.text,
    time: timeAgo(m.createdAt),
  };
}

function toResume(r: NonNullable<ApiResume>): NonNullable<Resume> {
  return { id: String(r.id), fileName: r.fileName, sizeLabel: r.sizeLabel, uploadedAt: timeAgo(r.uploadedAt) };
}

const EMPTY_MEMBER: Member = {
  id: '',
  name: '',
  initials: '',
  avatarColor: 'moss',
  headline: '',
  university: '',
  bio: '',
  skills: [],
  availability: { mentor: false, networking: false, referrals: false },
  isProfessional: false,
  visible: false,
};

type PortalState = {
  members: Record<string, Member>;
  requests: ConnectionRequest[];
  connections: Connection[];
  messages: ChatMessage[];
  resume: Resume;
  resumeSharedWith: string[];
};

const EMPTY_STATE: PortalState = {
  members: {},
  requests: [],
  connections: [],
  messages: [],
  resume: null,
  resumeSharedWith: [],
};

export type ProfessionalFilters = {
  company?: string;
  industry?: string;
  university?: string;
  mentor?: boolean;
  networking?: boolean;
};

type ProfileUpdate = Partial<{
  name: string;
  headline: string;
  university: string;
  major: string;
  bio: string;
  skills: string[];
  availability: Member['availability'];
  isProfessional: boolean;
  deactivated: boolean;
}>;

type PortalContextValue = {
  state: PortalState;
  currentUser: Member;
  currentUserId: string;
  sendRequest: (toId: string, requestType: RequestType, message: string) => Promise<void>;
  respondToRequest: (requestId: string, decision: 'accepted' | 'declined') => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  completeConnection: (connectionId: string) => Promise<void>;
  cancelConnection: (connectionId: string) => Promise<void>;
  sendMessage: (connectionId: string, text: string) => Promise<void>;
  updateProfile: (fields: ProfileUpdate) => Promise<void>;
  uploadResume: (file: File) => Promise<void>;
  deleteResume: () => Promise<void>;
  downloadResume: () => Promise<void>;
  shareResumeWithConnection: (connectionId: string) => Promise<void>;
  setDeactivated: (value: boolean) => Promise<void>;
  loadMember: (id: string) => Promise<Member | null>;
  loadProfessionals: (filters: ProfessionalFilters) => Promise<Member[]>;
};

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { getToken, isLoaded: authLoaded, isSignedIn } = useAuth();
  const [state, setState] = useState<PortalState>(EMPTY_STATE);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const loadStartedRef = useRef(false);

  const publicRoute = isPublicPortalRoute(pathname);

  const call = useCallback(
    async <T,>(path: string, init?: RequestInit) => {
      const token = await getToken();
      return apiRequest<T>(path, token, init);
    },
    [getToken]
  );

  useEffect(() => {
    if (publicRoute || !authLoaded || !isSignedIn || loadStartedRef.current) return;
    loadStartedRef.current = true;

    (async () => {
      const [me, incomingRaw, outgoingRaw, connectionsRaw, resumeRaw] = await Promise.all([
        call<ApiProfile>('/api/members/me/'),
        call<ApiRequest[]>('/api/requests/?direction=incoming'),
        call<ApiRequest[]>('/api/requests/?direction=outgoing'),
        call<ApiConnection[]>('/api/connections/'),
        call<ApiResume>('/api/resume/'),
      ]);

      const members: Record<string, Member> = { [String(me.id)]: toMember(me) };

      const otherIds = new Set<number>();
      incomingRaw.forEach(r => otherIds.add(r.fromId));
      outgoingRaw.forEach(r => otherIds.add(r.toId));
      connectionsRaw.forEach(c => c.memberIds.forEach(id => otherIds.add(id)));
      otherIds.delete(me.id);

      const others = await Promise.all(
        Array.from(otherIds).map(id => call<ApiProfile>(`/api/members/${id}/`).catch(() => null))
      );
      others.forEach(p => {
        if (p) members[String(p.id)] = toMember(p);
      });

      const connections = connectionsRaw.map(toConnection);
      const messageLists = await Promise.all(
        connections.map(c => call<ApiMessage[]>(`/api/connections/${c.id}/messages/`).catch(() => []))
      );

      setState({
        members,
        requests: [...incomingRaw, ...outgoingRaw].map(toRequest),
        connections,
        messages: messageLists.flat().map(toChatMessage),
        resume: resumeRaw ? toResume(resumeRaw) : null,
        resumeSharedWith: resumeRaw ? resumeRaw.sharedWith.map(String) : [],
      });
      setCurrentUserId(String(me.id));
      setReady(true);
    })().catch(err => {
      console.error('Failed to load portal data', err);
      setReady(true);
    });
  }, [publicRoute, authLoaded, isSignedIn, call]);

  const loadMember = useCallback(
    async (id: string): Promise<Member | null> => {
      const cached = state.members[id];
      if (cached) return cached;
      try {
        const profile = await call<ApiProfile>(`/api/members/${id}/`);
        const member = toMember(profile);
        setState(prev => ({ ...prev, members: { ...prev.members, [id]: member } }));
        return member;
      } catch {
        return null;
      }
    },
    [state.members, call]
  );

  const loadProfessionals = useCallback(
    async (filters: ProfessionalFilters): Promise<Member[]> => {
      const params = new URLSearchParams();
      if (filters.company) params.set('company', filters.company);
      if (filters.industry) params.set('industry', filters.industry);
      if (filters.university) params.set('university', filters.university);
      if (filters.mentor) params.set('availability.mentor', 'true');
      if (filters.networking) params.set('availability.networking', 'true');

      const data = await call<Paginated<ApiProfile>>(`/api/professionals/?${params.toString()}`);
      const list = resultsOf(data).map(toMember);
      setState(prev => {
        const members = { ...prev.members };
        list.forEach(m => {
          members[m.id] = m;
        });
        return { ...prev, members };
      });
      return list;
    },
    [call]
  );

  const sendRequest = useCallback(
    async (toId: string, requestType: RequestType, message: string) => {
      const created = await call<ApiRequest>('/api/requests/', {
        method: 'POST',
        body: JSON.stringify({ toId: Number(toId), requestType, message }),
      });
      setState(prev => ({ ...prev, requests: [...prev.requests, toRequest(created)] }));
    },
    [call]
  );

  const respondToRequest = useCallback(
    async (requestId: string, decision: 'accepted' | 'declined') => {
      if (decision === 'accepted') {
        const connection = await call<ApiConnection>(`/api/requests/${requestId}/accept/`, { method: 'POST' });
        const mapped = toConnection(connection);
        setState(prev => ({
          ...prev,
          requests: prev.requests.map(r => (r.id === requestId ? { ...r, status: 'accepted' } : r)),
          connections: [...prev.connections, mapped],
        }));
      } else {
        const updated = await call<ApiRequest>(`/api/requests/${requestId}/decline/`, { method: 'POST' });
        setState(prev => ({
          ...prev,
          requests: prev.requests.map(r => (r.id === requestId ? toRequest(updated) : r)),
        }));
      }
    },
    [call]
  );

  const cancelRequest = useCallback(
    async (requestId: string) => {
      const updated = await call<ApiRequest>(`/api/requests/${requestId}/cancel/`, { method: 'POST' });
      setState(prev => ({ ...prev, requests: prev.requests.map(r => (r.id === requestId ? toRequest(updated) : r)) }));
    },
    [call]
  );

  const completeConnection = useCallback(
    async (connectionId: string) => {
      const updated = await call<ApiConnection>(`/api/connections/${connectionId}/complete/`, { method: 'POST' });
      setState(prev => ({
        ...prev,
        connections: prev.connections.map(c => (c.id === connectionId ? toConnection(updated) : c)),
      }));
    },
    [call]
  );

  const cancelConnection = useCallback(
    async (connectionId: string) => {
      const updated = await call<ApiConnection>(`/api/connections/${connectionId}/cancel/`, { method: 'POST' });
      setState(prev => ({
        ...prev,
        connections: prev.connections.map(c => (c.id === connectionId ? toConnection(updated) : c)),
      }));
    },
    [call]
  );

  const sendMessage = useCallback(
    async (connectionId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const created = await call<ApiMessage>(`/api/connections/${connectionId}/messages/`, {
        method: 'POST',
        body: JSON.stringify({ text: trimmed }),
      });
      setState(prev => ({ ...prev, messages: [...prev.messages, toChatMessage(created)] }));
    },
    [call]
  );

  const updateProfile = useCallback(
    async (fields: ProfileUpdate) => {
      const updated = await call<ApiProfile>('/api/members/me/', { method: 'PATCH', body: JSON.stringify(fields) });
      const member = toMember(updated);
      setState(prev => ({ ...prev, members: { ...prev.members, [member.id]: member } }));
    },
    [call]
  );

  const uploadResume = useCallback(
    async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const created = await call<NonNullable<ApiResume>>('/api/resume/', { method: 'POST', body: form });
      setState(prev => ({ ...prev, resume: toResume(created), resumeSharedWith: created.sharedWith.map(String) }));
    },
    [call]
  );

  const deleteResume = useCallback(async () => {
    await call<void>('/api/resume/', { method: 'DELETE' });
    setState(prev => ({ ...prev, resume: null, resumeSharedWith: [] }));
  }, [call]);

  const downloadResume = useCallback(async () => {
    if (!state.resume) return;
    const token = await getToken();
    const blob = await apiDownload(`/api/resume/${state.resume.id}/download/`, token);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = state.resume.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }, [state.resume, getToken]);

  const shareResumeWithConnection = useCallback(
    async (connectionId: string) => {
      await call<void>(`/api/connections/${connectionId}/share-resume/`, { method: 'POST' });
      setState(prev =>
        prev.resumeSharedWith.includes(connectionId)
          ? prev
          : { ...prev, resumeSharedWith: [...prev.resumeSharedWith, connectionId] }
      );
    },
    [call]
  );

  const setDeactivated = useCallback(
    async (value: boolean) => {
      const updated = await call<ApiProfile>('/api/members/me/', {
        method: 'PATCH',
        body: JSON.stringify({ deactivated: value }),
      });
      const member = toMember(updated);
      setState(prev => ({ ...prev, members: { ...prev.members, [member.id]: member } }));
    },
    [call]
  );

  if (!publicRoute && !ready) {
    return (
      <div className="portal-guest">
        <div className="portal-auth-wrap">
          <p style={{ color: 'var(--ink-3)' }}>Loading your portal…</p>
        </div>
      </div>
    );
  }

  const currentUser = (currentUserId && state.members[currentUserId]) || EMPTY_MEMBER;

  const value: PortalContextValue = {
    state,
    currentUser,
    currentUserId: currentUserId ?? '',
    sendRequest,
    respondToRequest,
    cancelRequest,
    completeConnection,
    cancelConnection,
    sendMessage,
    updateProfile,
    uploadResume,
    deleteResume,
    downloadResume,
    shareResumeWithConnection,
    setDeactivated,
    loadMember,
    loadProfessionals,
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortalData() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortalData must be used within PortalDataProvider');
  return ctx;
}
