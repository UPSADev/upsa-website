'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { API_BASE, apiDownload, apiRequest } from './api';
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
  professionalRequested: boolean;
  deactivated: boolean;
  emailNotifications?: boolean;
  avatarUrl: string | null;
  hasAvatar: boolean;
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
  lastMessage?: { text: string; senderId: number; createdAt: string } | null;
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

type Paginated<T> = { results: T[]; next?: string | null } | T[];

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
  const name = p.name || PLACEHOLDER_NAME;
  return {
    id: String(p.id),
    name,
    initials: initialsFromName(name),
    avatarColor: colorForId(String(p.id)),
    // Local dev serves photos from the backend (relative path); R2 gives a full URL.
    avatarUrl: p.avatarUrl ? (/^https?:\/\//.test(p.avatarUrl) ? p.avatarUrl : `${API_BASE}${p.avatarUrl}`) : undefined,
    hasAvatar: p.hasAvatar,
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
    professionalRequested: p.professionalRequested,
    visible: !p.deactivated,
    emailNotifications: p.emailNotifications ?? true,
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
    lastMessage: c.lastMessage
      ? { text: c.lastMessage.text, senderId: String(c.lastMessage.senderId), time: timeAgo(c.lastMessage.createdAt) }
      : null,
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

// Shown for a profile whose owner hasn't entered a name yet.
export const PLACEHOLDER_NAME = 'New member';

// How often an idle tab asks the server "has anything changed?" (a tiny request).
// Real data is only downloaded when the answer is yes. Each tab is jittered by
// up to 20% so thousands of tabs never all ask at the same instant.
const SYNC_INTERVAL_MS = 30_000;
// An open conversation refreshes faster, but only that one conversation.
export const OPEN_THREAD_INTERVAL_MS = 5_000;

const EMPTY_MEMBER: Member = {
  id: '',
  name: '',
  initials: '',
  avatarColor: 'moss',
  hasAvatar: false,
  headline: '',
  university: '',
  bio: '',
  skills: [],
  availability: { mentor: false, networking: false, referrals: false },
  isProfessional: false,
  professionalRequested: false,
  visible: false,
  emailNotifications: true,
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
  search?: string;
  company?: string;
  industry?: string;
  university?: string;
  mentor?: boolean;
  networking?: boolean;
};

export type ProfessionalPage = { members: Member[]; hasMore: boolean };

// isProfessional is deliberately absent: it's the verified flag, and only an
// admin can set it (the backend ignores it even if sent). A member can only
// ask to be reviewed, with professionalRequested.
type ProfileUpdate = Partial<{
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
  availability: Member['availability'];
  professionalRequested: boolean;
  deactivated: boolean;
  emailNotifications: boolean;
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
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  downloadResume: () => Promise<void>;
  shareResumeWithConnection: (connectionId: string) => Promise<void>;
  setDeactivated: (value: boolean) => Promise<void>;
  loadMember: (id: string) => Promise<Member | null>;
  loadProfessionals: (filters: ProfessionalFilters, page?: number) => Promise<ProfessionalPage>;
  loadMessages: (connectionId: string) => Promise<void>;
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

  // Bumped at the start and end of every write. A background refresh that
  // overlaps a write is thrown away, so it can never clobber a fresh change
  // with data fetched just before it.
  const writeVersion = useRef(0);
  const knownMembers = useRef<Record<string, Member>>({});
  const syncVersion = useRef<string | null>(null);

  // Kept in a ref so `call` (and everything built on it) has a permanently
  // stable identity. Timers and effects that depend on it then never restart
  // just because Clerk handed back a fresh getToken function.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const call = useCallback(async <T,>(path: string, init?: RequestInit) => {
    const isWrite = Boolean(init?.method) && init?.method !== 'GET';
    if (isWrite) writeVersion.current++;
    try {
      const token = await getTokenRef.current();
      return await apiRequest<T>(path, token, init);
    } finally {
      if (isWrite) writeVersion.current++;
    }
  }, []);

  // Everything the portal shows about "me": profile, requests, connections and
  // resume. Profiles of other people are only fetched when they aren't already
  // known. Messages are NOT part of this: a conversation loads its own when it
  // is opened (and connections already carry a preview of the latest message),
  // so the cost of a refresh doesn't grow with how many conversations you have.
  const fetchSnapshot = useCallback(
    async (known: Record<string, Member> = {}, knownVersion?: string) => {
      // Asked first: if something changes while the rest downloads, the version
      // we keep is older than the data, so the next check simply refreshes again.
      const version = knownVersion ?? (await call<{ version: string }>('/api/sync/')).version;

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

      const missing = Array.from(otherIds).filter(id => !known[String(id)]);
      const others = await Promise.all(missing.map(id => call<ApiProfile>(`/api/members/${id}/`).catch(() => null)));
      others.forEach(p => {
        if (p) members[String(p.id)] = toMember(p);
      });

      const snapshot: PortalState = {
        members,
        requests: [...incomingRaw, ...outgoingRaw].map(toRequest),
        connections: connectionsRaw.map(toConnection),
        messages: [],
        resume: resumeRaw ? toResume(resumeRaw) : null,
        resumeSharedWith: resumeRaw ? resumeRaw.sharedWith.map(String) : [],
      };
      return { userId: String(me.id), snapshot, version };
    },
    [call]
  );

  useEffect(() => {
    knownMembers.current = state.members;
  }, [state.members]);

  useEffect(() => {
    if (publicRoute || !authLoaded || !isSignedIn || loadStartedRef.current) return;
    loadStartedRef.current = true;

    fetchSnapshot()
      .then(({ userId, snapshot, version }) => {
        syncVersion.current = version;
        setState(snapshot);
        setCurrentUserId(userId);
        setReady(true);
      })
      .catch(err => {
        console.error('Failed to load portal data', err);
        setReady(true);
      });
  }, [publicRoute, authLoaded, isSignedIn, fetchSnapshot]);

  // Quiet background refresh so new requests and accepted connections show up
  // without reloading. Every SYNC_INTERVAL_MS an idle tab makes ONE tiny request
  // ("what's the version of my data?") and downloads nothing unless it changed.
  useEffect(() => {
    if (!ready || publicRoute) return;
    let running = false;
    let timer: number | undefined;

    async function check() {
      if (document.hidden || running) return;
      running = true;
      const versionAtStart = writeVersion.current;
      try {
        const { version } = await call<{ version: string }>('/api/sync/');
        if (version === syncVersion.current) return;
        const fresh = await fetchSnapshot(knownMembers.current, version);
        if (versionAtStart !== writeVersion.current) return; // a save overlapped; try again next time
        syncVersion.current = fresh.version;
        setState(prev => ({
          ...fresh.snapshot,
          messages: prev.messages,
          members: { ...prev.members, ...fresh.snapshot.members },
        }));
      } catch {
        // transient (offline, sleeping laptop); the next check simply tries again
      } finally {
        running = false;
      }
    }

    function schedule() {
      timer = window.setTimeout(async () => {
        await check();
        schedule();
      }, SYNC_INTERVAL_MS * (0.8 + Math.random() * 0.4));
    }
    schedule();

    const onVisible = () => {
      if (!document.hidden) check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ready, publicRoute, call, fetchSnapshot]);

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
    async (filters: ProfessionalFilters, page = 1): Promise<ProfessionalPage> => {
      const params = new URLSearchParams();
      if (page > 1) params.set('page', String(page));
      if (filters.search) params.set('search', filters.search);
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
      return { members: list, hasMore: !Array.isArray(data) && Boolean(data.next) };
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

  // Loads one conversation's messages (the latest 200). Called when a
  // conversation is opened and every few seconds while it stays open.
  const loadMessages = useCallback(
    async (connectionId: string) => {
      const versionAtStart = writeVersion.current;
      const raw = await call<ApiMessage[]>(`/api/connections/${connectionId}/messages/`);
      if (versionAtStart !== writeVersion.current) return; // a send overlapped; the next call catches up
      const list = raw.map(toChatMessage);
      const last = raw[raw.length - 1];
      setState(prev => ({
        ...prev,
        messages: [...prev.messages.filter(m => m.connectionId !== connectionId), ...list],
        connections: last
          ? prev.connections.map(c =>
              c.id === connectionId
                ? { ...c, lastMessage: { text: last.text.slice(0, 140), senderId: String(last.senderId), time: timeAgo(last.createdAt) } }
                : c
            )
          : prev.connections,
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
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, toChatMessage(created)],
        connections: prev.connections.map(c =>
          c.id === connectionId
            ? { ...c, lastMessage: { text: created.text.slice(0, 140), senderId: String(created.senderId), time: 'Just now' } }
            : c
        ),
      }));
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

  const uploadAvatar = useCallback(
    async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const updated = await call<ApiProfile>('/api/members/me/avatar/', { method: 'POST', body: form });
      const member = toMember(updated);
      setState(prev => ({ ...prev, members: { ...prev.members, [member.id]: member } }));
    },
    [call]
  );

  const removeAvatar = useCallback(async () => {
    const updated = await call<ApiProfile>('/api/members/me/avatar/', { method: 'DELETE' });
    const member = toMember(updated);
    setState(prev => ({ ...prev, members: { ...prev.members, [member.id]: member } }));
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
    uploadAvatar,
    removeAvatar,
    shareResumeWithConnection,
    setDeactivated,
    loadMember,
    loadProfessionals,
    loadMessages,
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortalData() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortalData must be used within PortalDataProvider');
  return ctx;
}
