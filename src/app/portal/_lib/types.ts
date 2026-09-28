// Shared portal types. Data itself now comes from the real API (see api.ts
// and PortalDataProvider.tsx) - nothing here is seed/mock data anymore.

export type Availability = {
  mentor: boolean;
  networking: boolean;
  referrals: boolean;
};

export type Member = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  avatarUrl?: string;
  hasAvatar: boolean;
  headline: string;
  university: string;
  major?: string;
  company?: string;
  role?: string;
  industry?: string;
  location?: string;
  bio: string;
  skills: string[];
  availability: Availability;
  isProfessional: boolean;
  visible: boolean;
  emailNotifications: boolean;
};

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export type RequestType = 'networking' | 'mentorship' | 'referral';

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  networking: 'Professional networking',
  mentorship: 'Mentorship / career guidance',
  referral: 'Referral request',
};

export type ConnectionRequest = {
  id: string;
  fromId: string;
  toId: string;
  requestType: RequestType;
  message: string;
  status: RequestStatus;
  createdAt: string;
};

export type ConnectionStatus = 'active' | 'completed' | 'cancelled';

export type Connection = {
  id: string;
  requestId: string;
  memberIds: [string, string];
  status: ConnectionStatus;
  since: string;
  // The newest message, so a conversation list needs no per-thread download.
  lastMessage: { text: string; senderId: string; time: string } | null;
};

export type ChatMessage = {
  id: string;
  connectionId: string;
  senderId: string;
  text: string;
  time: string;
};

export type Resume = {
  id: string;
  fileName: string;
  sizeLabel: string;
  uploadedAt: string;
} | null;

export const AVATAR_COLORS = ['moss', 'gold', 'teal', 'plum', 'clay', 'slate'] as const;
